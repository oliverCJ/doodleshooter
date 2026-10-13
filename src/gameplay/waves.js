export const WAVE_ROSTER = [
  { type: 'grunt', from: 1, weight: 10 },
  { type: 'rusher', from: 2, weight: 6 },
  { type: 'bomber', from: 3, weight: 3 },
  { type: 'sniper', from: 3, weight: 4 },
  { type: 'flyer', from: 4, weight: 4 },
  { type: 'heavy', from: 5, weight: 4 },
  { type: 'shield', from: 6, weight: 4 },
];

export const WAVE_MODIFIERS = [
  { nameKey: '', speed: 1, damage: 1 },
  { nameKey: 'modifier.caffeine', speed: 1.35, damage: 0.85 },
  { nameKey: 'modifier.heavyInk', speed: 0.9, damage: 1.4 },
  { nameKey: 'modifier.swarm', speed: 1.15, damage: 0.9 },
];

const BASE_MODIFIER = { nameKey: '', speed: 1, damage: 1 };
const TIP_KEYS = ['tip.grapple', 'tip.block', 'tip.airKill', 'tip.grenade', 'tip.doubleJump'];

const clampRandom = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 1) return 1 - Number.EPSILON;
  return n;
};

const normalizeWave = (wave) => Math.max(1, Math.floor(Number(wave) || 1));

export function isBossWave(wave) {
  const n = normalizeWave(wave);
  return n > 0 && n % 5 === 0;
}

export function getBossType(wave, bossTypes = []) {
  if (!bossTypes.length || !isBossWave(wave)) return null;
  const index = (Math.floor(normalizeWave(wave) / 5) - 1) % bossTypes.length;
  return bossTypes[index];
}

export function buildEnemyPool(wave, roster = WAVE_ROSTER) {
  const n = normalizeWave(wave);
  return roster
    .filter((entry) => n >= entry.from)
    .map((entry) => ({
      type: entry.type,
      weight: entry.weight * Math.min(1, 0.3 + 0.25 * (n - entry.from)),
    }));
}

function selectModifier(wave, modifiers, rng) {
  const available = modifiers.length ? modifiers : [BASE_MODIFIER];
  const n = normalizeWave(wave);
  const allowed = isBossWave(n) || n < 4 ? 1 : n < 6 ? Math.min(3, available.length) : available.length;
  const index = Math.floor(clampRandom(rng()) * allowed);
  return { ...available[index] };
}

function pickWeighted(pool, totalWeight, rng) {
  if (!pool.length || totalWeight <= 0) return null;
  let target = clampRandom(rng()) * totalWeight;
  for (const entry of pool) {
    target -= entry.weight;
    if (target <= 0) return entry.type;
  }
  return pool[pool.length - 1].type;
}

export function buildWavePlan(wave, options = {}) {
  const n = normalizeWave(wave);
  const rng = typeof options.rng === 'function' ? options.rng : Math.random;
  const roster = Array.isArray(options.roster) ? options.roster : WAVE_ROSTER;
  const modifiers = Array.isArray(options.modifiers) ? options.modifiers : WAVE_MODIFIERS;
  const bossTypes = Array.isArray(options.bossTypes) ? options.bossTypes : [];
  const bossWave = isBossWave(n);
  const bossType = getBossType(n, bossTypes);
  const modifier = selectModifier(n, modifiers, rng);
  const swarm = modifier.nameKey === 'modifier.swarm';
  let maxAlive = Math.min(4 + Math.floor(n * 0.9) + (swarm ? 3 : 0), (swarm ? 22 : 18) + Math.floor(n / 3));
  let enemyCount = Math.round(Math.min(5 + n * 2.0, 32 + n) * (swarm ? 1.35 : 1));
  const enemyQueue = [];

  if (bossWave) {
    enemyCount = 7 + n;
    maxAlive += 2 + Math.floor(n / 5);
    if (bossType) enemyQueue.push(bossType);
  }

  const pool = buildEnemyPool(n, roster);
  const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
  for (let i = 0; i < enemyCount; i += 1) {
    const type = pickWeighted(pool, totalWeight, rng);
    if (type) enemyQueue.push(type);
  }

  return {
    wave: n,
    isBossWave: bossWave,
    bossType,
    modifier,
    enemyQueue,
    enemyCount,
    maxAlive,
    checkpoint: n >= 5 && n % 5 === 0,
    tipKey: TIP_KEYS[n - 1] || null,
    subtitleKey: bossWave ? 'wave.bossApproaching' : n === 1 ? 'wave.firstSubtitle' : null,
    pickupCount: 7,
  };
}
