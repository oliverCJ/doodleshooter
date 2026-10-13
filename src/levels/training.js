import * as THREE from 'three';
import { INK } from '../render.js';

export function buildTraining(B, arena = false) {
  const { L, box, slab, wallX, wallZ, stairs, rail, ring, spawn, sniper, pickup, collider } = B;
  L.key = 'training';
  L.playerStart.set(-30, 0, 28);
  L.bounds = { minX: -48, maxX: 48, minZ: -42, maxZ: 42 };

  const P = 48, Z = 42, T = 5, H = arena ? 22 : 18;
  box(0, -1, 0, P * 2 + T, 1, Z * 2 + T);
  box(0, 0, -Z, P * 2 + T, H, T);
  box(0, 0, Z, P * 2 + T, H, T);
  box(-P, 0, 0, T, H, Z * 2 + T);
  box(P, 0, 0, T, H, Z * 2 + T);
  collider(0, 50, 0, P * 2 + 30, 6, Z * 2 + 30, { noNav: true, noGrapple: true });

  // 左侧靶道用于练习不同距离的射击节奏，动态圆靶独立立在靶架上。
  slab(-43, -34, -16, 34, 0.12, 0.12, { ink: INK.GREEN });
  for (const z of [-24, -8, 8, 24]) {
    box(-42, 0, z, 1.2, 2.4, 4.8, { ink: INK.BLUE, noNav: true });
    box(-36, 0, z - 2.2, 0.14, 0.9, 0.12, { ink: INK.BLACK, noNav: true });
    box(-36, 0, z + 2.2, 0.14, 0.9, 0.12, { ink: INK.BLACK, noNav: true });
  }
  for (const z of [-34, 34]) wallX(-43, -16, z, 0, 1.4, 0.35, [], { ink: INK.BLACK, noNav: true });

  // 中央二层建筑提供窗口、屋顶和楼梯，覆盖单机绕怪与联机交火场景。
  const floorWithOpening = (x1, z1, x2, z2, y, t, [hx1, hz1, hx2, hz2]) => {
    slab(x1, z1, hx1, z2, y, t);
    slab(hx2, z1, x2, z2, y, t);
    slab(hx1, z1, hx2, hz1, y, t);
    slab(hx1, hz2, hx2, z2, y, t);
  };
  slab(-9, -12, 13, 12, 4, 0.4);
  floorWithOpening(-9, -12, 13, 12, 8, 0.4, [1.5, -9.4, 11.5, -6.6]);
  wallX(-9, 13, -12, 0, 8, 0.4, [[-6, -3, 0, 3.2], [2, 6, 4, 7.2], [8, 11, 4.8, 6.6]]);
  wallX(-9, 13, 12, 0, 8, 0.4, [[-7, -3, 0, 3.2], [1, 5, 4, 7.2], [7, 10, 4.8, 6.6]]);
  wallZ(-12, 12, -9, 0, 8, 0.4, [[-5, -1, 4.8, 6.6], [4, 8, 4.8, 6.6]]);
  wallZ(-12, 12, 13, 0, 8, 0.4, [[-8, -4, 4.8, 6.6], [1, 5, 4.8, 6.6], [6, 10, 4, 7.2]]);
  wallZ(-10, 10, 2, 0, 4, 0.35, [[-2, 2, 0, 3.2]], { ink: INK.BLUE });
  slab(13, 6, 17, 10, 4, 0.4, { ink: INK.ORANGE });
  box(16, 0, 7, 0.5, 4, 0.5, { ink: INK.BLACK, noNav: true });
  box(16, 0, 9, 0.5, 4, 0.5, { ink: INK.BLACK, noNav: true });
  stairs(15, 0, -3, '+z', 18, 2.2, { rise: 4 / 18, run: 0.5 });
  stairs(11, 4, -8, '-x', 18, 2.2, { rise: 4 / 18, run: 0.5 });
  box(1.5, 7.6, -8, 3, 0.4, 2.8, { ink: INK.ORANGE });
  rail(-9, -12, 13, -12, 8);
  rail(-9, 12, 13, 12, 8);
  rail(-9, -12, -9, 12, 8);
  rail(13, -12, 13, 12, 8);
  box(2, 8, 0, 4, 0.4, 4, { ink: INK.ORANGE });
  ring(2, 12, 0, 'y');
  ring(-8, 7, -18, 'y');
  ring(14, 7, 18, 'y');

  // 建筑背后的钩爪平台必须有落地支撑和楼梯，避免形成不符合物理直觉的悬浮平台。
  slab(2, 18, 14, 30, 4, 0.4, { ink: INK.ORANGE });
  box(3, 0, 19, 0.5, 4, 0.5, { ink: INK.BLACK, noNav: true });
  box(13, 0, 19, 0.5, 4, 0.5, { ink: INK.BLACK, noNav: true });
  box(3, 0, 29, 0.5, 4, 0.5, { ink: INK.BLACK, noNav: true });
  box(13, 0, 29, 0.5, 4, 0.5, { ink: INK.BLACK, noNav: true });
  slab(14, 22, 17, 26, 4, 0.4, { ink: INK.ORANGE });
  box(16, 0, 23, 0.5, 4, 0.5, { ink: INK.BLACK, noNav: true });
  box(16, 0, 25, 0.5, 4, 0.5, { ink: INK.BLACK, noNav: true });
  stairs(25, 0, 24, '-x', 18, 2.2, { rise: 4 / 18, run: 0.5 });
  rail(2, 18, 14, 18, 4);
  rail(2, 30, 14, 30, 4);
  rail(2, 18, 2, 30, 4);
  ring(8, 7, 24, 'y');

  // 右侧移动区只保留地面轨道，避免靶场上方出现悬浮建筑。
  box(32, 0, -14, 10, 0.08, 0.18, { ink: INK.BLACK, noCollide: true });
  box(35, 0, 8, 0.18, 0.08, 9, { ink: INK.BLACK, noCollide: true });
  box(36, 0, 30, 13, 1.2, 4, { ink: INK.ORANGE });

  for (const [x, z, w, d] of [[-8, 24, 7, 1.2], [8, 26, 6, 1.2], [20, 30, 1.2, 7], [-18, -30, 6, 1.2], [6, -30, 1.2, 6]]) box(x, 0, z, w, 1.3, d, { ink: INK.BLACK, noNav: true });
  for (const [x, y, z] of [[-30, 0, 30], [-18, 0, -28], [0, 4, 0], [2, 8, 0], [32, 4.2, -14], [36, 10, 16], [30, 0, 32]]) pickup(x, y, z);

  for (const [x, y, z] of [[-44, 0, -34], [-44, 0, 34], [-20, 0, -38], [0, 0, -36], [20, 0, 36], [44, 0, -34], [44, 0, 34], [2, 8.2, 0], [36, 10.2, 16]]) spawn(x, y, z);
  for (const [x, y, z] of [[2, 8.2, 0], [37, 10.2, 16], [-17, 0, 24], [-17, 0, -24]]) sniper(x, y, z);
  for (const [x, y, z] of [[-36, 0, 30], [36, 0, -30], [-36, 0, -30], [36, 0, 30], [0, 8.4, 0], [25, 7.4, 0], [37, 10.2, 16], [-18, 0, 0], [0, 0, 34], [0, 0, -34]]) L.arenaSpawns.push(new THREE.Vector3(x, y, z));

  L.trainingTargets = [
    { type: 'ring', name: '近距圆靶 A', pos: [-36, 2.2, -24], yaw: Math.PI / 2, hp: 100, doubleSided: true },
    { type: 'ring', name: '中距圆靶 A', pos: [-36, 2.2, -8], yaw: Math.PI / 2, hp: 100, doubleSided: true },
    { type: 'ring', name: '远距圆靶 A', pos: [-36, 2.4, 8], yaw: Math.PI / 2, hp: 120, doubleSided: true },
    { type: 'ring', name: '远距圆靶 B', pos: [-36, 2.4, 24], yaw: Math.PI / 2, hp: 120, doubleSided: true },
    { type: 'moving-ring', name: '横移圆靶', pos: [32, 2.2, -14], yaw: 0, hp: 120, doubleSided: true, path: { axis: 'x', distance: 8, speed: 2.6, pause: [0.2, 0.7] } },
    { type: 'moving-ring', name: '纵移圆靶', pos: [35, 2.2, 8], yaw: 0, hp: 120, doubleSided: true, path: { axis: 'z', distance: 7, speed: 2.2, pause: [0.3, 0.8] } },
    { type: 'dummy', name: '门口假人', pos: [-5, 0, 10.5], yaw: Math.PI, hp: 180 },
    { type: 'dummy', name: '一层走廊假人', pos: [7, 0, -7], yaw: -Math.PI / 2, hp: 180 },
    { type: 'dummy', name: '楼梯口假人', pos: [9, 4.2, -10], yaw: -Math.PI / 2, hp: 180 },
    { type: 'dummy', name: '窗口假人', pos: [12, 4.2, 2], yaw: -Math.PI / 2, hp: 180 },
    { type: 'dummy', name: '二层房间假人', pos: [-5, 4.2, 6], yaw: Math.PI / 2, hp: 180 },
    { type: 'dummy', name: '钩爪平台假人', pos: [8, 4.2, 24], yaw: Math.PI, hp: 180 },
    { type: 'dummy', name: '屋顶假人', pos: [2, 8.4, 0], yaw: Math.PI, hp: 220 },
  ];
  return B.finish();
}
