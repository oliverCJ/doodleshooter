export function ringHitResult(radiusRatio, baseHp = 100, moving = false) {
  let ring = 0;
  if (radiusRatio <= 0.25) ring = 10;
  else if (radiusRatio <= 0.5) ring = 8;
  else if (radiusRatio <= 0.75) ring = 6;
  else if (radiusRatio <= 1) ring = 4;
  else return null;
  const damageByRing = { 10: 80, 8: 55, 6: 35, 4: 20 };
  const scoreByRing = { 10: 120, 8: 85, 6: 55, 4: 30 };
  const scale = Math.max(0.5, Math.min(2, baseHp / 100));
  const moveBonus = moving ? 30 : 0;
  return { label: `${ring} 环`, ring, damage: Math.round(damageByRing[ring] * scale), score: scoreByRing[ring] + moveBonus };
}

export function dummyHitResult(part) {
  if (part === 'head') return { label: '头部', damage: 120, score: 180, crit: true };
  if (part === 'torso' || part === 'hips' || part === 'unknown') return { label: '躯干', damage: 70, score: 90, crit: false };
  return { label: '四肢', damage: 35, score: 45, crit: false };
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

export function movingPathOffset(path, time) {
  const distance = Number(path.distance || 0);
  const speed = Math.max(0.01, Number(path.speed || 1));
  const pauseRange = Array.isArray(path.pause) ? path.pause : [0, 0];
  const pause = (Number(pauseRange[0] || 0) + Number(pauseRange[1] || 0)) / 2;
  const travel = distance / (speed * 2);
  const cycle = Math.max(0.01, travel * 2 + pause * 2);
  const t = ((time + Number(path.phase || 0)) % cycle + cycle) % cycle;
  let pos;
  if (t < pause) pos = -distance / 2;
  else if (t < pause + travel) pos = -distance / 2 + distance * smoothstep((t - pause) / travel);
  else if (t < pause + travel + pause) pos = distance / 2;
  else pos = distance / 2 - distance * smoothstep((t - pause - travel - pause) / travel);
  const v = { x: 0, y: 0, z: 0 };
  v[path.axis === 'z' ? 'z' : path.axis === 'y' ? 'y' : 'x'] = Number(pos.toFixed(3));
  return v;
}
