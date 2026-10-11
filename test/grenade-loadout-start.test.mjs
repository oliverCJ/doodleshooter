import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const startWave = main.slice(main.indexOf('function startWave(n) {'), main.indexOf('function pickSpawn(type) {'));

assert.doesNotMatch(
  startWave,
  /player\.grenades\s*=\s*Math\.min\(player\.maxGrenades, player\.grenades\s*\+\s*1\)/,
  'starting a wave must not override the configured grenade loadout'
);
