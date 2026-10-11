export class ThrowableManager {
  constructor(ctx, registry, loadout) {
    this.ctx = ctx;
    this.registry = registry || {};
    this.loadout = { ...(loadout || {}) };
    this.active = [];
  }

  count(id = 'grenade') { return this.loadout[id] || 0; }
  setLoadout(loadout) { this.loadout = { ...(loadout || {}) }; }
  consume(id = 'grenade') { if (this.count(id) <= 0) return false; this.loadout[id]--; return true; }
  add(id = 'grenade', amount = 1) {
    const meta = this.registry[id]; if (!meta) return;
    this.loadout[id] = Math.min(meta.maxCount, this.count(id) + amount);
  }
}
