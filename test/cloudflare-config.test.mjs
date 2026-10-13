import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));

assert.equal(config.name, 'doodleshooter');
assert.match(config.compatibility_date, /^\d{4}-\d{2}-\d{2}$/);
assert.deepEqual(config.assets, { directory: './dist' });
assert.equal(Object.hasOwn(config, 'main'), false, 'Workers deployment should be static-assets only');
assert.equal(Object.hasOwn(config, 'routes'), false, 'Routes should be configured outside the project file');

console.log('cloudflare config tests passed');
