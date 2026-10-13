import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { APP_VERSION, SIGNALING_VERSION, SIGNALING_VERSION_LABEL } from '../src/version.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const versionParts = pkg.version.split('.');

assert.match(pkg.version, /^\d+\.\d+\.\d+$/, 'package.json version should use major.minor.patch');
assert.equal(APP_VERSION, pkg.version, 'APP_VERSION should match package.json version');
assert.equal(SIGNALING_VERSION, `${versionParts[0]}.${versionParts[1]}`, 'SIGNALING_VERSION should use package major.minor');
assert.equal(SIGNALING_VERSION_LABEL, `v${SIGNALING_VERSION.replaceAll('.', '-')}`, 'SIGNALING_VERSION_LABEL should be peer-id safe');
assert.match(SIGNALING_VERSION_LABEL, /^[A-Za-z0-9_-]+$/, 'SIGNALING_VERSION_LABEL should only use PeerJS-safe id characters');

console.log('version tests passed');
