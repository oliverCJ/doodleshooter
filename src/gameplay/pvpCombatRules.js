const BLADE_REFLECT_CHANCE = 0.4;
const BLADE_REFLECT_DAMAGE_MULTIPLIER = 0.6;
const KATANA_PARRY_FACING_DOT = 0.6;
const FRONT_HIT_PART = /^(head|torso|arm|fore)/;

const cloneScoreRow = (row) => ({ id: row.id, name: row.name, kills: row.kills, deaths: row.deaths });

export function canParryKatanaHit({ facingDot, part, source, parryWindow }) {
  return Number(facingDot) > KATANA_PARRY_FACING_DOT
    && FRONT_HIT_PART.test(String(part || ''))
    && source === 'katana'
    && !!parryWindow;
}

export function resolveRemotePlayerHit({ hit = {}, target = {}, random = Math.random() } = {}) {
  const damage = Number(hit.damage) || 0;
  if (hit.part === 'blade') {
    const reflected = Number(random) < BLADE_REFLECT_CHANCE;
    return {
      type: 'blade-deflect',
      reflected,
      reflectedDamage: reflected ? damage * BLADE_REFLECT_DAMAGE_MULTIPLIER : 0,
      outgoingDamage: 0,
      sendParry: true,
    };
  }
  if (canParryKatanaHit({ facingDot: hit.facingDot, part: hit.part, source: hit.source, parryWindow: target.parryWindow })) {
    return { type: 'katana-parried', reflected: false, reflectedDamage: 0, outgoingDamage: 0, sendParry: false };
  }
  return { type: 'damage', reflected: false, reflectedDamage: 0, outgoingDamage: damage, sendParry: false };
}

export function canApplyIncomingPlayerDamage({ playerAlive, gameState, shieldTime }) {
  return !!playerAlive && gameState === 'play' && Number(shieldTime || 0) <= 0;
}

export function buildLocalDeathPayload({ killer = null, lastHit = {}, dir = null, how = null } = {}) {
  return {
    killer,
    dir: dir || lastHit.from || null,
    over: !!(lastHit.crit || lastHit.amount >= 90 || lastHit.src === 'katana'),
    how,
    crit: !!lastHit.crit,
  };
}

export function applyPvpDeathScore(rows, { victim, killer } = {}) {
  return rows.map((row) => {
    const next = cloneScoreRow(row);
    if (next.id === victim) next.deaths++;
    if (killer && killer !== victim && next.id === killer) next.kills++;
    return next;
  });
}

export function applyPvpFallPenalty(rows, { playerId } = {}) {
  return rows.map((row) => {
    const next = cloneScoreRow(row);
    if (next.id === playerId) next.kills = Math.max(0, next.kills - 1);
    return next;
  });
}

export function sortPvpScores(rows) {
  return rows.map(cloneScoreRow).sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
}

export function findPvpWinner(rows, targetKills) {
  let winner = null;
  for (const row of rows) if (row.kills >= targetKills) winner = row;
  return winner ? { id: winner.id, name: winner.name } : null;
}
