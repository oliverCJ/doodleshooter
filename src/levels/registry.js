import { buildDistrict } from './district.js';
import { buildMexico } from './mexico.js';
import { buildTraining } from './training.js';

export const LEVEL_REGISTRY = {
  district: {
    key: 'district',
    nameKey: 'map.district.name',
    blurbKey: 'map.district.blurb',
    type: 'fixed',
    modes: ['solo', 'arena'],
    build: buildDistrict,
  },
  mexico: {
    key: 'mexico',
    nameKey: 'map.mexico.name',
    blurbKey: 'map.mexico.blurb',
    type: 'fixed',
    modes: ['solo', 'arena'],
    build: buildMexico,
  },
  training: {
    key: 'training',
    nameKey: 'map.training.name',
    blurbKey: 'map.training.blurb',
    type: 'fixed',
    modes: ['solo', 'arena'],
    build: buildTraining,
  },
};

export const LEVELS = Object.values(LEVEL_REGISTRY).map(({ key, nameKey, blurbKey, type, modes }) => ({ key, nameKey, blurbKey, type, modes }));

export function findLevelDefinition(key) {
  return LEVEL_REGISTRY[key] || LEVEL_REGISTRY.district;
}
