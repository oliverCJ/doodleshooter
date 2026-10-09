export const MAP_CONFIG_STORAGE_KEY = 'doodle_map_config';
export const LEGACY_MAP_STORAGE_KEY = 'doodle_map';
export const DEFAULT_MAP_CONFIG = Object.freeze({ type: 'fixed', key: 'district' });

function hasLevel(levels, key) {
  return Array.isArray(levels) && levels.some((level) => level && level.key === key);
}

export function normalizeMapConfig(value, levels) {
  const raw = typeof value === 'string' ? { type: 'fixed', key: value } : value;
  if (!raw || raw.type !== 'fixed' || typeof raw.key !== 'string') return { ...DEFAULT_MAP_CONFIG };
  if (!hasLevel(levels, raw.key)) return { ...DEFAULT_MAP_CONFIG };
  return { type: 'fixed', key: raw.key };
}

export function serializeMapConfig(value, levels) {
  return normalizeMapConfig(value, levels);
}

export function readMapConfig(storage, levels) {
  try {
    const saved = storage.getItem(MAP_CONFIG_STORAGE_KEY);
    if (saved) return normalizeMapConfig(JSON.parse(saved), levels);
  } catch (e) {
    // 配置损坏时回退到旧地图键，避免坏本地数据阻止玩家进入菜单。
  }
  return normalizeMapConfig(storage.getItem(LEGACY_MAP_STORAGE_KEY), levels);
}

export function writeMapConfig(storage, levels, value) {
  const next = normalizeMapConfig(value, levels);
  storage.setItem(MAP_CONFIG_STORAGE_KEY, JSON.stringify(next));
  return next;
}
