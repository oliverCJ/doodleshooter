export const THROWABLE_REGISTRY = {
  grenade: {
    id: 'grenade',
    nameKey: 'throwable.grenade.name',
    category: 'explosive',
    defaultCount: 3,
    maxCount: 5,
    fuse: 1.7,
    cooldown: 0.55,
  },
};

export const THROWABLE_IDS = Object.keys(THROWABLE_REGISTRY);
