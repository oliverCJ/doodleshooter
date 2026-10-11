import assert from 'node:assert/strict';
import { THROWABLE_REGISTRY } from '../src/throwables.js';
import { ThrowableManager } from '../src/throwableManager.js';

const manager = new ThrowableManager({}, THROWABLE_REGISTRY, { grenade: 3 });

assert.equal(manager.count('grenade'), 3);
assert.equal(manager.consume('grenade'), true);
assert.equal(manager.count('grenade'), 2);

manager.setLoadout({ grenade: 0 });
assert.equal(manager.consume('grenade'), false);
assert.equal(manager.count('grenade'), 0);

manager.add('grenade', 99);
assert.equal(manager.count('grenade'), 5);
assert.deepEqual(manager.active, []);
