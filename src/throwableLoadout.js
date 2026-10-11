export const THROWABLE_LOADOUT_STORAGE_KEY = 'doodle_throwables';
export const MAX_THROWABLE_TOTAL = 5;
export const DEFAULT_THROWABLE_LOADOUT = { grenade: 3 };

export function totalThrowables(loadout) {
  return Object.values(loadout || {}).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
}

export function normalizeThrowableLoadout(value, registry) {
  const out = {};
  let remaining = MAX_THROWABLE_TOTAL;
  for (const id of Object.keys(registry || {})) {
    const raw = value && Object.prototype.hasOwnProperty.call(value, id) ? Number(value[id]) : DEFAULT_THROWABLE_LOADOUT[id] || 0;
    const max = registry[id].maxCount ?? MAX_THROWABLE_TOTAL;
    const count = Math.max(0, Math.min(max, Math.floor(Number.isFinite(raw) ? raw : 0), remaining));
    out[id] = count;
    remaining -= count;
  }
  return out;
}

export function readThrowableLoadout(storage, registry) {
  try {
    return normalizeThrowableLoadout(JSON.parse(storage.getItem(THROWABLE_LOADOUT_STORAGE_KEY) || 'null'), registry);
  } catch (error) {
    return normalizeThrowableLoadout(DEFAULT_THROWABLE_LOADOUT, registry);
  }
}

export function writeThrowableLoadout(storage, registry, loadout) {
  const value = normalizeThrowableLoadout(loadout, registry);
  storage.setItem(THROWABLE_LOADOUT_STORAGE_KEY, JSON.stringify(value));
  return value;
}
