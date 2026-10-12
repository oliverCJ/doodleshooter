import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  applyPvpDeathScore,
  applyPvpFallPenalty,
  buildLocalDeathPayload,
  canApplyIncomingPlayerDamage,
  canParryKatanaHit,
  findPvpWinner,
  resolveRemotePlayerHit,
  sortPvpScores,
} from '../src/gameplay/pvpCombatRules.js';

{
  const result = resolveRemotePlayerHit({
    hit: { part: 'blade', source: 'rifle', damage: 50, crit: false, facingDot: 0 },
    random: 0.2,
  });
  assert.equal(result.type, 'blade-deflect');
  assert.equal(result.reflected, true);
  assert.equal(result.reflectedDamage, 30);
  assert.equal(result.outgoingDamage, 0);
  assert.equal(result.sendParry, true);
}

{
  const result = resolveRemotePlayerHit({
    hit: { part: 'blade', source: 'rifle', damage: 50, crit: false, facingDot: 0 },
    random: 0.8,
  });
  assert.equal(result.type, 'blade-deflect');
  assert.equal(result.reflected, false);
  assert.equal(result.reflectedDamage, 0);
  assert.equal(result.outgoingDamage, 0);
  assert.equal(result.sendParry, true);
}

{
  assert.equal(canParryKatanaHit({ facingDot: 0.7, part: 'torso', source: 'katana', parryWindow: true }), true);
  assert.equal(canParryKatanaHit({ facingDot: 0.6, part: 'torso', source: 'katana', parryWindow: true }), false);
  assert.equal(canParryKatanaHit({ facingDot: 0.9, part: 'leg', source: 'katana', parryWindow: true }), false);
  assert.equal(canParryKatanaHit({ facingDot: 0.9, part: 'torso', source: 'rifle', parryWindow: true }), false);
  assert.equal(canParryKatanaHit({ facingDot: 0.9, part: 'torso', source: 'katana', parryWindow: false }), false);
}

{
  const result = resolveRemotePlayerHit({
    hit: { part: 'torso', source: 'katana', damage: 55, crit: false, facingDot: 0.75 },
    target: { parryWindow: true },
    random: 0.9,
  });
  assert.equal(result.type, 'katana-parried');
  assert.equal(result.reflected, false);
  assert.equal(result.outgoingDamage, 0);
  assert.equal(result.sendParry, false);
}

{
  const result = resolveRemotePlayerHit({
    hit: { part: 'head', source: 'sniper', damage: 150, crit: true, facingDot: 0.9 },
    target: { parryWindow: true },
    random: 0.1,
  });
  assert.equal(result.type, 'damage');
  assert.equal(result.outgoingDamage, 150);
  assert.equal(result.reflected, false);
}

{
  assert.equal(canApplyIncomingPlayerDamage({ playerAlive: true, gameState: 'play', shieldTime: 0 }), true);
  assert.equal(canApplyIncomingPlayerDamage({ playerAlive: false, gameState: 'play', shieldTime: 0 }), false);
  assert.equal(canApplyIncomingPlayerDamage({ playerAlive: true, gameState: 'lobby', shieldTime: 0 }), false);
  assert.equal(canApplyIncomingPlayerDamage({ playerAlive: true, gameState: 'play', shieldTime: 0.1 }), false);
}

{
  assert.deepEqual(buildLocalDeathPayload({ killer: 'p2', lastHit: { from: [1, 2, 3], crit: true, amount: 20, src: 'rifle' }, how: 'Rifle' }), {
    killer: 'p2',
    dir: [1, 2, 3],
    over: true,
    how: 'Rifle',
    crit: true,
  });
  assert.equal(buildLocalDeathPayload({ killer: 'p2', lastHit: { amount: 90, src: 'rifle' }, how: null }).over, true);
  assert.equal(buildLocalDeathPayload({ killer: 'p2', lastHit: { amount: 20, src: 'katana' }, how: null }).over, true);
  assert.deepEqual(buildLocalDeathPayload({ killer: 'p2', lastHit: { from: [9, 9, 9] }, dir: [0, 1, 0], how: null }).dir, [0, 1, 0]);
  assert.equal(buildLocalDeathPayload({ killer: null, lastHit: {}, how: null }).over, false);
}

{
  const rows = [
    { id: 'a', name: 'A', kills: 0, deaths: 0 },
    { id: 'b', name: 'B', kills: 1, deaths: 0 },
  ];
  assert.deepEqual(applyPvpDeathScore(rows, { victim: 'a', killer: 'b' }), [
    { id: 'a', name: 'A', kills: 0, deaths: 1 },
    { id: 'b', name: 'B', kills: 2, deaths: 0 },
  ]);
  assert.deepEqual(rows, [
    { id: 'a', name: 'A', kills: 0, deaths: 0 },
    { id: 'b', name: 'B', kills: 1, deaths: 0 },
  ]);
}

{
  const rows = [{ id: 'a', name: 'A', kills: 3, deaths: 0 }];
  assert.deepEqual(applyPvpDeathScore(rows, { victim: 'a', killer: 'a' }), [{ id: 'a', name: 'A', kills: 3, deaths: 1 }]);
  assert.deepEqual(applyPvpDeathScore(rows, { victim: 'a', killer: null }), [{ id: 'a', name: 'A', kills: 3, deaths: 1 }]);
}

{
  assert.deepEqual(applyPvpFallPenalty([{ id: 'a', name: 'A', kills: 0, deaths: 0 }], { playerId: 'a' }), [{ id: 'a', name: 'A', kills: 0, deaths: 0 }]);
  assert.deepEqual(applyPvpFallPenalty([{ id: 'a', name: 'A', kills: 2, deaths: 0 }], { playerId: 'a' }), [{ id: 'a', name: 'A', kills: 1, deaths: 0 }]);
}

{
  const rows = [
    { id: 'a', name: 'A', kills: 4, deaths: 3 },
    { id: 'b', name: 'B', kills: 6, deaths: 2 },
    { id: 'c', name: 'C', kills: 4, deaths: 1 },
  ];
  assert.deepEqual(sortPvpScores(rows).map((row) => row.id), ['b', 'c', 'a']);
}

{
  assert.deepEqual(findPvpWinner([{ id: 'a', name: 'A', kills: 20, deaths: 3 }], 20), { id: 'a', name: 'A' });
  assert.deepEqual(findPvpWinner([{ id: 'a', name: 'A', kills: 20, deaths: 3 }, { id: 'b', name: 'B', kills: 21, deaths: 1 }], 20), { id: 'b', name: 'B' });
  assert.equal(findPvpWinner([{ id: 'a', name: 'A', kills: 19, deaths: 3 }], 20), null);
}

const source = readFileSync(new URL('../src/gameplay/pvpCombatRules.js', import.meta.url), 'utf8');
assert.doesNotMatch(source, /from ['"]three['"]|\.\.\/hud\.js|\.\.\/net\.js|\bdocument\b|\bwindow\b|\blocalStorage\b|new Player\b|new RemotePlayer\b/);

console.log('pvp-combat-rules tests passed');
