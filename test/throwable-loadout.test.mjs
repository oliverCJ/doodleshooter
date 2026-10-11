import assert from 'node:assert/strict';
import { THROWABLE_REGISTRY, THROWABLE_IDS } from '../src/throwables.js';
import { DEFAULT_THROWABLE_LOADOUT, MAX_THROWABLE_TOTAL, normalizeThrowableLoadout, readThrowableLoadout, totalThrowables, writeThrowableLoadout } from '../src/throwableLoadout.js';

function memoryStorage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) || null, setItem: (key, value) => data.set(key, String(value)) };
}

assert.deepEqual(THROWABLE_IDS, ['grenade']);
assert.equal(THROWABLE_REGISTRY.grenade.maxCount, 5);
assert.equal(MAX_THROWABLE_TOTAL, 5);
assert.deepEqual(DEFAULT_THROWABLE_LOADOUT, { grenade: 3 });
assert.equal(totalThrowables({ grenade: 3 }), 3);
assert.deepEqual(normalizeThrowableLoadout({ grenade: 99 }, THROWABLE_REGISTRY), { grenade: 5 });
assert.deepEqual(normalizeThrowableLoadout({ grenade: -2 }, THROWABLE_REGISTRY), { grenade: 0 });
assert.deepEqual(normalizeThrowableLoadout({ grenade: 2, unknown: 3 }, THROWABLE_REGISTRY), { grenade: 2 });

const storage = memoryStorage();
assert.deepEqual(readThrowableLoadout(storage, THROWABLE_REGISTRY), { grenade: 3 });
writeThrowableLoadout(storage, THROWABLE_REGISTRY, { grenade: 4 });
assert.deepEqual(readThrowableLoadout(storage, THROWABLE_REGISTRY), { grenade: 4 });
