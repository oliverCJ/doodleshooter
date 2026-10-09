import { buildDistrict } from './district.js';
import { buildMexico } from './mexico.js';
import { buildTraining } from './training.js';

export const LEVEL_REGISTRY = {
  district: {
    key: 'district',
    name: '涂鸦街区',
    blurb: '街道、屋顶与消防梯',
    type: 'fixed',
    modes: ['solo', 'arena'],
    build: buildDistrict,
  },
  mexico: {
    key: 'mexico',
    name: '涂鸦墨西哥',
    blurb: '阳光烘烤的广场 · 皮纳塔、塔可和马里亚奇乐队',
    type: 'fixed',
    modes: ['solo', 'arena'],
    build: buildMexico,
  },
  training: {
    key: 'training',
    name: '涂鸦训练场',
    blurb: '靶道、二层小楼、抓钩和跳台',
    type: 'fixed',
    modes: ['solo', 'arena'],
    build: buildTraining,
  },
};

export const LEVELS = Object.values(LEVEL_REGISTRY).map(({ key, name, blurb, type, modes }) => ({ key, name, blurb, type, modes }));

export function findLevelDefinition(key) {
  return LEVEL_REGISTRY[key] || LEVEL_REGISTRY.district;
}
