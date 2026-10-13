import assert from 'node:assert/strict';
import {
  DEFAULT_MAP_CONFIG,
  MAP_CONFIG_STORAGE_KEY,
  normalizeMapConfig,
  readMapConfig,
  serializeMapConfig,
  writeMapConfig,
} from '../src/mapConfig.js';

const levels = [
  { key: 'district' },
  { key: 'mexico' },
  { key: 'training' },
];

function storage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    dump() { return Object.fromEntries(data.entries()); },
  };
}

assert.deepEqual(DEFAULT_MAP_CONFIG, { type: 'fixed', key: 'district' });
assert.deepEqual(normalizeMapConfig({ type: 'fixed', key: 'training' }, levels), { type: 'fixed', key: 'training' });
assert.deepEqual(normalizeMapConfig('mexico', levels), { type: 'fixed', key: 'mexico' });
assert.deepEqual(normalizeMapConfig({ type: 'random', key: 'city', seed: 'A1' }, levels), DEFAULT_MAP_CONFIG);
assert.deepEqual(normalizeMapConfig({ type: 'fixed', key: 'missing' }, levels), DEFAULT_MAP_CONFIG);
assert.deepEqual(serializeMapConfig({ type: 'fixed', key: 'training' }, levels), { type: 'fixed', key: 'training' });

const oldStore = storage({ doodle_map: 'mexico' });
assert.deepEqual(readMapConfig(oldStore, levels), { type: 'fixed', key: 'mexico' });

const newStore = storage({ [MAP_CONFIG_STORAGE_KEY]: JSON.stringify({ type: 'fixed', key: 'training' }), doodle_map: 'mexico' });
assert.deepEqual(readMapConfig(newStore, levels), { type: 'fixed', key: 'training' });

const badStore = storage({ [MAP_CONFIG_STORAGE_KEY]: '{bad json', doodle_map: 'missing' });
assert.deepEqual(readMapConfig(badStore, levels), DEFAULT_MAP_CONFIG);

const writeStore = storage();
assert.deepEqual(writeMapConfig(writeStore, levels, { type: 'fixed', key: 'training' }), { type: 'fixed', key: 'training' });
assert.equal(writeStore.dump()[MAP_CONFIG_STORAGE_KEY], JSON.stringify({ type: 'fixed', key: 'training' }));
assert.equal(writeStore.dump().doodle_map, undefined);
