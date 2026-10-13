import { createBuilder } from './levels/builder.js';
import { LEVELS, findLevelDefinition } from './levels/registry.js';
import {
  DEFAULT_MAP_CONFIG,
  normalizeMapConfig,
  readMapConfig,
  serializeMapConfig,
  writeMapConfig,
} from './mapConfig.js';

export { DEFAULT_MAP_CONFIG, LEVELS, normalizeMapConfig, readMapConfig, serializeMapConfig, writeMapConfig };

export function buildLevel(scene, world, mapConfig = DEFAULT_MAP_CONFIG, opts = {}) {
  const config = normalizeMapConfig(mapConfig, LEVELS);
  const B = createBuilder(scene, world);
  return findLevelDefinition(config.key).build(B, !!opts.arena);
}
