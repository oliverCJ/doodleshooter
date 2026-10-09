// Weapon slot rules are kept separate from the player and menu so every entry point validates the same loadout.
export const LOADOUT_STORAGE_KEY = 'doodle_loadout';

export const LOADOUT_SLOTS = [
  { id: 'primary', name: '主武器', accepts: ['gun'] },
  { id: 'melee', name: '近战武器', accepts: ['melee'] },
  { id: 'secondary1', name: '副武器 1', accepts: ['gun', 'melee'] },
  { id: 'secondary2', name: '副武器 2', accepts: ['gun', 'melee'] },
];

export const DEFAULT_LOADOUT = ['rifle', 'katana', 'shotgun', 'sniper'];

export function validateLoadout(loadout, registry) {
  if (!Array.isArray(loadout) || loadout.length !== LOADOUT_SLOTS.length) return { ok: false, reason: '请选择 4 个武器槽位' };
  const seen = new Set();
  for (let i = 0; i < LOADOUT_SLOTS.length; i++) {
    const id = loadout[i];
    const weapon = registry && registry[id];
    if (!weapon) return { ok: false, reason: '包含未知武器' };
    if (seen.has(id)) return { ok: false, reason: '不能重复选择同一把武器' };
    seen.add(id);
    if (!LOADOUT_SLOTS[i].accepts.includes(weapon.category)) return { ok: false, reason: `${LOADOUT_SLOTS[i].name} 类型不匹配` };
  }
  return { ok: true, reason: '' };
}

export function normalizeLoadout(value, registry) {
  const loadout = Array.isArray(value) ? value.slice(0, LOADOUT_SLOTS.length) : DEFAULT_LOADOUT.slice();
  return validateLoadout(loadout, registry).ok ? loadout : DEFAULT_LOADOUT.slice();
}

export function serializeLoadout(loadout, registry) {
  return normalizeLoadout(loadout, registry);
}

export function readLoadout(storage, registry) {
  try {
    return normalizeLoadout(JSON.parse(storage.getItem(LOADOUT_STORAGE_KEY) || 'null'), registry);
  } catch (error) {
    return DEFAULT_LOADOUT.slice();
  }
}

export function writeLoadout(storage, registry, loadout) {
  const value = normalizeLoadout(loadout, registry);
  storage.setItem(LOADOUT_STORAGE_KEY, JSON.stringify(value));
  return value;
}

