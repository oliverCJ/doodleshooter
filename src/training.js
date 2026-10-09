import * as THREE from 'three';
import { makeInkMaterial, INK } from './render.js';
import { buildHumanoid } from './enemies.js';
import { ringHitResult, dummyHitResult, movingPathOffset } from './trainingRules.js';
import { rand } from './util.js';
import { audio } from './audio.js';

const _v = new THREE.Vector3();
const _yAxis = new THREE.Vector3(0, 1, 0);
const _zAxis = new THREE.Vector3(0, 0, 1);
const RESPAWN_DELAY = 2;
const RING_FACE_OFFSET = 0.08;

function makeRingTarget(def) {
  const group = new THREE.Group();
  const matBlue = makeInkMaterial({ ink: INK.BLUE, fill: true, side: THREE.DoubleSide });
  const matOrange = makeInkMaterial({ ink: INK.ORANGE, fill: true, side: THREE.DoubleSide });
  const matRed = makeInkMaterial({ ink: INK.RED, fill: true, side: THREE.DoubleSide });
  const matBlack = makeInkMaterial({ ink: INK.BLACK });
  for (const side of [1, -1]) {
    for (const [radius, mat] of [[0.9, matBlue], [0.65, matOrange], [0.38, matBlue], [0.16, matRed]]) {
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 32), mat);
      mesh.position.z = side * (RING_FACE_OFFSET + 0.004 * (1 - radius));
      if (side < 0) mesh.rotation.y = Math.PI;
      group.add(mesh);
    }
  }
  // 靶架按靶心高度落地，避免移动靶看起来悬空。
  const standHeight = Math.max(0.8, Number(def.pos && def.pos[1] || 2.2) - 0.25);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, standHeight, 0.12), matBlack);
  post.position.y = -0.25 - standHeight / 2;
  group.add(post);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.5), matBlack);
  foot.position.y = -0.25 - standHeight;
  group.add(foot);
  return { group, radius: 0.9, parts: [{ part: 'ring', center: new THREE.Vector3(), radius: 0.9 }] };
}

function makeDummyTarget(def) {
  const mat = makeInkMaterial({ ink: INK.RED, shadeScale: 0, shadeBias: 1 });
  const solid = makeInkMaterial({ ink: INK.BLACK, fill: true, side: THREE.DoubleSide });
  const model = buildHumanoid(mat, solid, { weapon: 'rifle', scale: def.scale || 1, hat: 'helmet', build: { bodyW: 1, headS: 1, limbR: 0.032 } });
  model.root.rotation.y = Math.PI;
  return { group: model.root, model, radius: 0.9, parts: model.hit.map(([part, radius]) => ({ part, center: new THREE.Vector3(), radius })) };
}

export class TrainingManager {
  constructor(ctx) {
    this.ctx = ctx;
    this.targets = [];
    this.enabled = false;
    this.aimed = null;
  }

  start(level) {
    this.clear();
    this.enabled = true;
    const defs = Array.isArray(level.trainingTargets) ? level.trainingTargets : [];
    for (const def of defs) this._spawn(def);
    if (!defs.length) this.ctx.hud.tip('暂无训练靶', 2);
  }

  clear() {
    for (const target of this.targets) this.ctx.scene.remove(target.group);
    this.targets.length = 0;
    this.enabled = false;
    this.aimed = null;
    if (this.ctx.hud.setTrainingTarget) this.ctx.hud.setTrainingTarget(null);
  }

  _spawn(def) {
    if (!def || !Array.isArray(def.pos) || !def.type) { console.warn('Invalid training target config', def); return; }
    const built = def.type === 'dummy' ? makeDummyTarget(def) : makeRingTarget(def);
    const target = {
      id: this.targets.length,
      type: def.type,
      name: def.name || '训练靶',
      hp: def.hp || 100,
      maxHp: def.hp || 100,
      basePos: new THREE.Vector3().fromArray(def.pos),
      yaw: def.yaw || 0,
      path: def.path || null,
      group: built.group,
      model: built.model || null,
      radius: built.radius,
      parts: built.parts,
      alive: true,
      downT: 0,
      phase: rand(0, 4),
    };
    target.group.position.copy(target.basePos);
    target.group.rotation.y = target.yaw;
    this.ctx.scene.add(target.group);
    this.targets.push(target);
    this._updateParts(target);
  }

  update(dt) {
    if (!this.enabled) return;
    for (const target of this.targets) {
      if (target.path && target.alive) {
        const off = movingPathOffset({ ...target.path, phase: target.phase }, this.ctx.game.time);
        target.group.position.set(target.basePos.x + off.x, target.basePos.y + off.y, target.basePos.z + off.z);
      }
      if (!target.alive) {
        target.downT -= dt;
        if (target.downT <= 0) this._reset(target);
      }
      this._updateParts(target);
    }
    this._updateAimedTarget();
  }

  _reset(target) {
    target.alive = true;
    target.hp = target.maxHp;
    target.phase = rand(0, 4);
    target.group.visible = true;
    if (target.model && target.model.face) {
      target.model.face.eyes.visible = true;
      target.model.face.xeyes.visible = false;
    }
  }

  _updateParts(target) {
    target.group.updateMatrixWorld(true);
    if (target.type === 'dummy' && target.model) {
      target.parts = target.model.hit.map(([part, radius]) => {
        const center = new THREE.Vector3();
        const node = target.model.parts[part];
        if (node) node.getWorldPosition(center); else target.group.getWorldPosition(center);
        return { part, center, radius: radius * (target.model.root.scale.x || 1) };
      });
      return;
    }
    target.parts[0].center.set(0, 0, 0).applyMatrix4(target.group.matrixWorld);
  }

  raycast(origin, dir, maxDist) {
    if (!this.enabled) return null;
    let best = null;
    for (const target of this.targets) {
      if (!target.alive) continue;
      const hit = target.type === 'dummy' ? this._raycastDummy(target, origin, dir, maxDist) : this._raycastRing(target, origin, dir, maxDist);
      if (hit && (!best || hit.dist < best.dist)) best = hit;
    }
    return best;
  }

  _raycastRing(target, origin, dir, maxDist) {
    const normal = _zAxis.clone().applyAxisAngle(_yAxis, target.yaw).normalize();
    const denom = dir.dot(normal);
    if (Math.abs(denom) < 1e-5) return null;
    const dist = _v.subVectors(target.group.position, origin).dot(normal) / denom;
    if (dist < 0 || dist > maxDist) return null;
    const point = origin.clone().addScaledVector(dir, dist);
    const local = target.group.worldToLocal(point.clone());
    const radiusRatio = Math.hypot(local.x, local.y) / target.radius;
    const ring = ringHitResult(radiusRatio, target.maxHp, target.type === 'moving-ring');
    if (!ring) return null;
    return { target, point, dist, part: 'ring', radiusRatio, result: ring };
  }

  _raycastDummy(target, origin, dir, maxDist) {
    let best = null;
    for (const part of target.parts) {
      _v.subVectors(part.center, origin);
      const tca = _v.dot(dir);
      if (tca < 0 || tca > maxDist) continue;
      const d2 = _v.lengthSq() - tca * tca;
      if (d2 > part.radius * part.radius) continue;
      const dist = tca - Math.sqrt(part.radius * part.radius - d2);
      if (dist < 0) continue;
      if (!best || dist < best.dist) best = { target, point: origin.clone().addScaledVector(dir, dist), dist, part: part.part, result: dummyHitResult(part.part) };
    }
    return best;
  }

  damage(target, amount, hitInfo = {}) {
    if (!target || !target.alive) return false;
    const result = hitInfo.result || (target.type === 'dummy' ? dummyHitResult(hitInfo.part) : ringHitResult(hitInfo.radiusRatio || 1, target.maxHp, target.type === 'moving-ring'));
    if (!result) return false;
    target.hp = Math.max(0, target.hp - result.damage);
    const killed = target.hp <= 0;
    this.ctx.hud.hitmarker(killed, !!result.crit || result.ring === 10);
    this.ctx.game.addScore(result.score, `${result.label} · -${result.damage} HP`);
    this.ctx.effects.strokeBurst(hitInfo.point || target.group.position, INK.ORANGE, 8, 5, { life: 0.2, size: 0.035 });
    audio.hitEnemy(hitInfo.point || target.group.position);
    if (killed) this._knockDown(target);
    if (this.aimed === target && this.ctx.hud.setTrainingTarget) this.ctx.hud.setTrainingTarget({ name: target.name, hp: target.hp, maxHp: target.maxHp });
    return true;
  }

  _knockDown(target) {
    target.alive = false;
    target.downT = RESPAWN_DELAY;
    target.group.visible = false;
    if (target.model && target.model.face) {
      target.model.face.eyes.visible = false;
      target.model.face.xeyes.visible = true;
    }
  }

  _updateAimedTarget() {
    const hit = this.raycast(this.ctx.player.eye, this.ctx.player.forward, 80);
    const target = hit ? hit.target : null;
    if (target === this.aimed) {
      if (target && this.ctx.hud.setTrainingTarget) this.ctx.hud.setTrainingTarget({ name: target.name, hp: target.hp, maxHp: target.maxHp });
      return;
    }
    this.aimed = target;
    if (this.ctx.hud.setTrainingTarget) this.ctx.hud.setTrainingTarget(target ? { name: target.name, hp: target.hp, maxHp: target.maxHp } : null);
  }
}
