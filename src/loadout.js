// Weapon slot rules are kept separate from the player and menu so every entry point validates the same loadout.
export const LOADOUT_STORAGE_KEY = 'doodle_loadout';

export const LOADOUT_SLOTS = [
  { id: 'primary', nameKey: 'loadout.slot.primary', accepts: ['gun'] },
  { id: 'melee', nameKey: 'loadout.slot.melee', accepts: ['melee'] },
  { id: 'secondary1', nameKey: 'loadout.slot.secondary1', accepts: ['gun', 'melee'] },
  { id: 'secondary2', nameKey: 'loadout.slot.secondary2', accepts: ['gun', 'melee'] },
];

export const DEFAULT_LOADOUT = ['rifle', 'katana', 'shotgun', 'sniper'];

export function validateLoadout(loadout, registry) {
  if (!Array.isArray(loadout) || loadout.length !== LOADOUT_SLOTS.length) return { ok: false, reasonKey: 'loadout.error.needFourSlots' };
  const seen = new Set();
  for (let i = 0; i < LOADOUT_SLOTS.length; i++) {
    const id = loadout[i];
    const weapon = registry && registry[id];
    if (!weapon) return { ok: false, reasonKey: 'loadout.error.unknownWeapon' };
    if (seen.has(id)) return { ok: false, reasonKey: 'loadout.error.duplicateWeapon' };
    seen.add(id);
    if (!LOADOUT_SLOTS[i].accepts.includes(weapon.category)) return { ok: false, reasonKey: 'loadout.error.slotTypeMismatch', params: { slotKey: LOADOUT_SLOTS[i].nameKey } };
  }
  return { ok: true, reasonKey: '' };
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
