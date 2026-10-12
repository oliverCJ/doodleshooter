import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  WAVE_MODIFIERS,
  WAVE_ROSTER,
  buildEnemyPool,
  buildWavePlan,
  getBossType,
  isBossWave,
} from '../src/gameplay/waves.js';

function fixedRng(values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

assert.equal(isBossWave(1), false);
assert.equal(isBossWave(5), true);
assert.equal(isBossWave(10), true);
assert.equal(getBossType(5, ['boss', 'eraser', 'inkblot']), 'boss');
assert.equal(getBossType(10, ['boss', 'eraser', 'inkblot']), 'eraser');
assert.equal(getBossType(15, ['boss', 'eraser', 'inkblot']), 'inkblot');
assert.equal(getBossType(20, ['boss', 'eraser', 'inkblot']), 'boss');
assert.equal(getBossType(5, []), null);

assert.deepEqual(buildEnemyPool(1).map((entry) => entry.type), ['grunt']);
assert.deepEqual(buildEnemyPool(2).map((entry) => entry.type), ['grunt', 'rusher']);
assert.deepEqual(buildEnemyPool(3).map((entry) => entry.type), ['grunt', 'rusher', 'bomber', 'sniper']);
assert.deepEqual(buildEnemyPool(4).map((entry) => entry.type), ['grunt', 'rusher', 'bomber', 'sniper', 'flyer']);
assert.deepEqual(buildEnemyPool(5).map((entry) => entry.type), ['grunt', 'rusher', 'bomber', 'sniper', 'flyer', 'heavy']);
assert.deepEqual(buildEnemyPool(6).map((entry) => entry.type), ['grunt', 'rusher', 'bomber', 'sniper', 'flyer', 'heavy', 'shield']);

const rusherWeight = buildEnemyPool(2).find((entry) => entry.type === 'rusher');
assert.equal(rusherWeight.type, 'rusher');
assert.ok(Math.abs(rusherWeight.weight - 1.8) < 1e-9);
assert.deepEqual(buildEnemyPool(5).find((entry) => entry.type === 'heavy'), { type: 'heavy', weight: 1.2 });

const waveOne = buildWavePlan(1, { rng: fixedRng([0]) });
assert.equal(waveOne.wave, 1);
assert.equal(waveOne.isBossWave, false);
assert.equal(waveOne.bossType, null);
assert.equal(waveOne.modifier.nameKey, '');
assert.equal(waveOne.enemyCount, 7);
assert.equal(waveOne.maxAlive, 4);
assert.equal(waveOne.enemyQueue.length, 7);
assert.ok(waveOne.enemyQueue.every((type) => type === 'grunt'));
assert.equal(waveOne.checkpoint, false);
assert.equal(waveOne.tipKey, 'tip.grapple');
assert.equal(waveOne.subtitleKey, 'wave.firstSubtitle');
assert.equal(waveOne.pickupCount, 7);

const normalWave = buildWavePlan(4, { rng: fixedRng([0.99, 0.99, 0.99, 0.99, 0.99]) });
assert.equal(normalWave.modifier.nameKey, 'modifier.heavyInk');
assert.equal(normalWave.enemyCount, 13);
assert.equal(normalWave.maxAlive, 7);

const swarmWave = buildWavePlan(6, { rng: fixedRng([0.99, 0, 0, 0, 0, 0]) });
assert.equal(swarmWave.modifier.nameKey, 'modifier.swarm');
assert.equal(swarmWave.enemyCount, 23);
assert.equal(swarmWave.maxAlive, 12);

const bossWave = buildWavePlan(5, { bossTypes: ['boss', 'eraser', 'inkblot'], rng: fixedRng([0]) });
assert.equal(bossWave.isBossWave, true);
assert.equal(bossWave.bossType, 'boss');
assert.equal(bossWave.enemyCount, 12);
assert.equal(bossWave.maxAlive, 11);
assert.equal(bossWave.enemyQueue[0], 'boss');
assert.equal(bossWave.enemyQueue.length, 13);
assert.equal(bossWave.checkpoint, true);
assert.equal(bossWave.subtitleKey, 'wave.bossApproaching');

const emptyPlan = buildWavePlan(0, { roster: [], modifiers: [], bossTypes: [], rng: () => 2 });
assert.equal(emptyPlan.wave, 1);
assert.deepEqual(emptyPlan.modifier, { nameKey: '', speed: 1, damage: 1 });
assert.deepEqual(emptyPlan.enemyQueue, []);
assert.equal(emptyPlan.maxAlive, 4);

const rosterSnapshot = JSON.stringify(WAVE_ROSTER);
const modifierSnapshot = JSON.stringify(WAVE_MODIFIERS);
const bossTypes = ['boss', 'eraser'];
const bossSnapshot = JSON.stringify(bossTypes);
buildWavePlan(6, { roster: WAVE_ROSTER, modifiers: WAVE_MODIFIERS, bossTypes, rng: fixedRng([0.5]) });
assert.equal(JSON.stringify(WAVE_ROSTER), rosterSnapshot);
assert.equal(JSON.stringify(WAVE_MODIFIERS), modifierSnapshot);
assert.equal(JSON.stringify(bossTypes), bossSnapshot);

const source = readFileSync(new URL('../src/gameplay/waves.js', import.meta.url), 'utf8');
assert.doesNotMatch(source, /three|\.\/hud|\.\.\/hud|audio|Net|networkConfig|document|window|localStorage/);

console.log('waves tests passed');
