import assert from 'node:assert/strict';
import {
  ringHitResult,
  dummyHitResult,
  movingPathOffset,
} from '../src/trainingRules.js';

assert.deepEqual(ringHitResult(0.0, 100, false), { label: '10 环', ring: 10, damage: 80, score: 120 });
assert.deepEqual(ringHitResult(0.32, 100, false), { label: '8 环', ring: 8, damage: 55, score: 85 });
assert.deepEqual(ringHitResult(0.58, 100, false), { label: '6 环', ring: 6, damage: 35, score: 55 });
assert.deepEqual(ringHitResult(0.86, 100, false), { label: '4 环', ring: 4, damage: 20, score: 30 });
assert.equal(ringHitResult(1.1, 100, false), null);
assert.deepEqual(ringHitResult(0.0, 100, true), { label: '10 环', ring: 10, damage: 80, score: 150 });

assert.deepEqual(dummyHitResult('head'), { label: '头部', damage: 120, score: 180, crit: true });
assert.deepEqual(dummyHitResult('torso'), { label: '躯干', damage: 70, score: 90, crit: false });
assert.deepEqual(dummyHitResult('armL'), { label: '四肢', damage: 35, score: 45, crit: false });
assert.deepEqual(dummyHitResult('unknown'), { label: '躯干', damage: 70, score: 90, crit: false });

const path = { axis: 'x', distance: 6, speed: 2, pause: [0.25, 0.25], phase: 0 };
assert.deepEqual(movingPathOffset(path, 0), { x: -3, y: 0, z: 0 });
assert.deepEqual(movingPathOffset(path, 1.75), { x: 3, y: 0, z: 0 });
assert.deepEqual(movingPathOffset({ ...path, axis: 'z' }, 1.75), { x: 0, y: 0, z: 3 });
