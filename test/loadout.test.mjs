import assert from 'node:assert/strict';
import {
  DEFAULT_LOADOUT,
  normalizeLoadout,
  readLoadout,
  validateLoadout,
  serializeLoadout,
  writeLoadout,
} from '../src/loadout.js';

const registry = {
  rifle: { id: 'rifle', category: 'gun' },
  shotgun: { id: 'shotgun', category: 'gun' },
  sniper: { id: 'sniper', category: 'gun' },
  revolver: { id: 'revolver', category: 'gun' },
  katana: { id: 'katana', category: 'melee' },
};

assert.deepEqual(DEFAULT_LOADOUT, ['rifle', 'katana', 'shotgun', 'sniper']);
assert.deepEqual(normalizeLoadout(['rifle', 'katana', 'revolver', 'shotgun'], registry), ['rifle', 'katana', 'revolver', 'shotgun']);
assert.deepEqual(normalizeLoadout(['missing', 'rifle'], registry), DEFAULT_LOADOUT);
assert.equal(validateLoadout(['rifle', 'katana', 'revolver', 'shotgun'], registry).ok, true);
assert.equal(validateLoadout(['katana', 'rifle', 'revolver', 'shotgun'], registry).ok, false);
assert.equal(validateLoadout(['rifle', 'katana', 'rifle', 'shotgun'], registry).ok, false);
assert.equal(validateLoadout(['rifle', 'shotgun', 'revolver', 'sniper'], registry).ok, false);
assert.deepEqual(serializeLoadout(['rifle', 'katana', 'revolver', 'shotgun'], registry), ['rifle', 'katana', 'revolver', 'shotgun']);

const storage = new Map();
const localStorageLike = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value),
};
assert.deepEqual(writeLoadout(localStorageLike, registry, ['rifle', 'katana', 'revolver', 'shotgun']), ['rifle', 'katana', 'revolver', 'shotgun']);
assert.deepEqual(readLoadout(localStorageLike, registry), ['rifle', 'katana', 'revolver', 'shotgun']);
storage.set('doodle_loadout', '{broken');
assert.deepEqual(readLoadout(localStorageLike, registry), DEFAULT_LOADOUT);
