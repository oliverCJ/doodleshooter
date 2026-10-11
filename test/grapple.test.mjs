import assert from 'node:assert/strict';
import { GRAPPLE_MAX_DISTANCE, canUseGrappleTarget, filterGrappleTargets } from '../src/grapple.js';

assert.equal(GRAPPLE_MAX_DISTANCE, 100);
assert.equal(canUseGrappleTarget({ dist: 99.9 }), true);
assert.equal(canUseGrappleTarget({ dist: 100 }), true);
assert.equal(canUseGrappleTarget({ dist: 100.1 }), false);
assert.equal(canUseGrappleTarget(null), false);

const targets = [{ id: 'far', dist: 140 }, { id: 'near', dist: 25 }, { id: 'edge', dist: 100 }];
assert.deepEqual(filterGrappleTargets(targets).map((t) => t.id), ['near', 'edge']);
