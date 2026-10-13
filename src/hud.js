// DOM heads-up display drawn in "pen" style (multiplied over the paper canvas).
export class HUD {
  constructor(root, i18n = null) {
    this.root = root;
    this.i18n = i18n;
    const t = (key, params) => this.i18n ? this.i18n.t(key, params) : key;
    root.innerHTML = `
      <div class="scope" id="scope"><div class="mask"></div><div class="ring"></div><div class="cx"></div><div class="cy"></div><div class="dot"></div></div>
      <div class="focus-meter" id="focusmeter"><div class="fm-label" id="fmlabel">${t('hud.katana')}</div><div class="fm-tube"><div class="fm-fill" id="fmfill"></div><i class="fm-f1"></i><i class="fm-f2"></i><i class="fm-f3"></i></div><div class="fm-ready" id="fmready">${t('hud.katanaReady')}</div></div>
      <div class="focus-mark" id="focusmark"><i></i><i></i><i></i><i></i></div>
      <div class="crosshair" id="crosshair"><i class="ch-t"></i><i class="ch-b"></i><i class="ch-l"></i><i class="ch-r"></i><i class="ch-dot"></i></div>
      <div class="grapple-ret" id="gret"></div><div class="gstam" id="gstam" hidden><i id="gstamfill"></i></div>
      <div class="hitmarker" id="hitmarker"><i></i><i></i></div>
      <div class="dmg-ind" id="dmg"></div>
      <div class="hud-tl"><div class="score"><span id="scoreLabel">${t('hud.score')}</span> <b id="score">0</b></div><div class="combo" id="combo"></div></div>
      <div class="hud-tr"><div class="wave"><span id="waveLabel">${t('hud.wave')}</span> <b id="wave">1</b></div><div class="modifier" id="modifier"></div><div class="left"><b id="left">0</b> <span id="leftLabel">${t('hud.enemiesLeft')}</span></div><div class="timer" id="timer"></div><div class="pvpscore" id="pvpscore" hidden></div></div><div class="board" id="board" hidden></div>
      <div class="bossbar" id="bossbar"><div class="bossname" id="bossname"></div><div class="bar big"><div class="fill red" id="bossfill"></div></div></div>
      <div class="training-target" id="trainingTarget" hidden><span id="trainingName"></span><div class="bar"><div class="fill" id="trainingFill"></div></div></div>
      <div class="hud-bl">
        <div class="health"><span id="healthLabel">${t('hud.health')}</span><div class="bar"><div class="fill" id="hpfill"></div></div><span id="hpnum">100</span></div>
        <div class="ammo"><b id="mag">30</b><span id="reserve">/120</span><span class="reloading" id="reloading"></span><span class="nades" id="nades" title="${t('throwable.grenade.name')}"></span></div>
        <div class="tally" id="tally"></div>
      </div>
      <div class="hud-br"><div class="slots" id="slots"></div><div class="weapon" id="weapon">${t('weapon.rifle.name')}</div><div class="hint" id="hint"></div></div>
      <div class="tip" id="tip"></div>
      <div class="message"><div class="msg-main" id="msg"></div><div class="msg-sub" id="msgsub"></div></div>
      <div class="killfeed" id="killfeed"></div>
      <div class="screen" id="screen"><div class="panel" id="panel"></div></div>`;
    const q = (id) => root.querySelector('#' + id);
    this.el = { crosshair: q('crosshair'), gret: q('gret'), hitmarker: q('hitmarker'), dmg: q('dmg'), score: q('score'), scoreLabel: q('scoreLabel'), combo: q('combo'), wave: q('wave'), waveLabel: q('waveLabel'), modifier: q('modifier'), left: q('left'), leftLabel: q('leftLabel'), timer: q('timer'), hpfill: q('hpfill'), hpnum: q('hpnum'), healthLabel: q('healthLabel'), mag: q('mag'), reserve: q('reserve'), reloading: q('reloading'), tally: q('tally'), weapon: q('weapon'), hint: q('hint'), slots: q('slots'), tip: q('tip'), msg: q('msg'), msgsub: q('msgsub'), killfeed: q('killfeed'), screen: q('screen'), panel: q('panel'), nades: q('nades'), scope: q('scope'), focusmark: q('focusmark'), focusmeter: q('focusmeter'), fmlabel: q('fmlabel'), fmfill: q('fmfill'), fmready: q('fmready'), bossbar: q('bossbar'), bossname: q('bossname'), bossfill: q('bossfill'), trainingTarget: q('trainingTarget'), trainingName: q('trainingName'), trainingFill: q('trainingFill'), pvpscore: q('pvpscore'), board: q('board'), gstam: q('gstam'), gstamfill: q('gstamfill') };
    this._msgT = 0; this._scope = false; this._nades = -1; this._pad = false; this.onDevice = null; this._fmShow = false; this._fmFrac = -1; this._fmReady = false; this._lastTally = -1; this._lastSlots = ''; this._ads = false; this._mode = ''; this.onScreenClick = null; this._tipT = 0;
    this.el.screen.addEventListener('click', () => { if (this.onScreenClick) this.onScreenClick(); });
  }
  refreshStaticText() {
    if (!this.i18n) return;
    this.el.scoreLabel.textContent = this.i18n.t('hud.score');
    this.el.waveLabel.textContent = this.i18n.t('hud.wave');
    this.el.leftLabel.textContent = this.i18n.t('hud.enemiesLeft');
    this.el.healthLabel.textContent = this.i18n.t('hud.health');
    this.el.nades.title = this.i18n.t('throwable.grenade.name');
    this.el.fmready.textContent = this.i18n.t('hud.katanaReady');
    if (!this._fmShow) this.el.fmlabel.textContent = this.i18n.t('hud.katana');
  }
  // katana charge gauge: fills with katana kills, catches fire when a focus slash is ready
  setFocusMeter(show, frac, ready, label = null) {
    const m = this.el.focusmeter;
    const nextLabel = label || (this.i18n ? this.i18n.t('hud.katana') : 'hud.katana');
    if (show !== this._fmShow) { this._fmShow = show; m.classList.toggle('on', show); }
    if (!show) return;
    if (nextLabel !== this._fmLabel) { this._fmLabel = nextLabel; m.querySelector('.fm-label').textContent = nextLabel; }
    const f = Math.max(0, Math.min(1, frac));
    if (Math.abs(f - (this._fmFrac ?? -1)) > 0.005) { this._fmFrac = f; this.el.fmfill.style.height = (f * 100).toFixed(1) + '%'; }
    if (ready !== this._fmReady) { this._fmReady = ready; m.classList.toggle('ready', ready); }
  }
  setGrenades(n) { if (n === this._nades) return; this._nades = n; let h = ''; for (let i = 0; i < n; i++) h += '<i></i>'; this.el.nades.innerHTML = h; }
  // control labels follow whatever you touched last
  setDevice(pad) { if (pad === this._pad) return; this._pad = pad; this.root.classList.toggle('pad', pad); if (this.onDevice) this.onDevice(pad); }
  key(action) { return (this._pad ? PAD_KEYS : KB_KEYS)[action] || action; }
  setScope(on) { if (on === this._scope) return; this._scope = on; this.el.scope.classList.toggle('on', on); }
  setFocusMark(x, y) {
    const m = this.el.focusmark;
    if (x == null) { m.classList.remove('on'); return; }
    m.classList.add('on'); m.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`;
  }
  setSpread(px) { this.el.crosshair.style.setProperty('--s', px.toFixed(1) + 'px'); }
  setCrosshairMode(mode) { this._mode = mode; this._applyCross(); }
  setAds(on) { if (on === this._ads) return; this._ads = on; this._applyCross(); }
  _applyCross() { this.el.crosshair.className = 'crosshair ' + this._mode + (this._ads ? ' ads' : ''); }
  setGrappleStamina(f) { const show = f < 0.995; if (this.el.gstam.hidden === show) this.el.gstam.hidden = !show; if (show) { this.el.gstamfill.style.width = (f * 100).toFixed(0) + '%'; this.el.gstam.classList.toggle('low', f < 0.2); } }
  grappleTarget(state) { this.el.gret.className = 'grapple-ret' + (state === 1 ? ' on' : state === 2 ? ' on attached' : ''); }
  hitmarker(kill = false, crit = false) { const h = this.el.hitmarker; h.className = 'hitmarker' + (kill ? ' kill' : '') + (crit ? ' crit' : ''); void h.offsetWidth; h.classList.add('show'); }
  setAmmo(mag, reserve, magSize, reloading = false) {
    this.el.mag.textContent = mag; this.el.reserve.textContent = '/' + reserve; this.el.reloading.textContent = reloading ? (this.i18n ? this.i18n.t('hud.reloading') : 'hud.reloading') : '';
    if (mag !== this._lastTally) { this._lastTally = mag; let s = ''; for (let i = 0; i < Math.min(mag, 40); i++) s += '<i></i>'; this.el.tally.innerHTML = s; }
  }
  setKatana() { this.el.mag.textContent = '∞'; this.el.reserve.textContent = ''; this.el.reloading.textContent = ''; if (this._lastTally !== -1) { this.el.tally.innerHTML = ''; this._lastTally = -1; } }
  setSlots(slots) {
    const key = slots.map((s) => `${s.name}|${s.active ? 1 : 0}|${s.ammo}`).join(';'); if (key === this._lastSlots) return; this._lastSlots = key;
    this.el.slots.innerHTML = slots.map((s, i) => `<div class="slot${s.active ? ' active' : ''}${s.empty ? ' empty' : ''}"><span class="num">${i + 1}</span>${s.name}<span class="sammo">${s.ammo}</span></div>`).join('');
  }
  setHealth(hp, max) { const f = Math.max(0, hp / max); this.el.hpfill.style.width = (f * 100).toFixed(1) + '%'; this.el.hpnum.textContent = Math.ceil(hp); this.root.classList.toggle('low', f < 0.3); }
  setBoard(html) { const on = !!html; this.el.board.hidden = !on; if (on) this.el.board.innerHTML = html; }
  setPvpScore(html) { const on = !!html; this.el.pvpscore.hidden = !on; if (on) this.el.pvpscore.innerHTML = html; this.el.wave.parentElement.hidden = on; this.el.left.parentElement.hidden = on; }
  setWave(n, left) { this.el.wave.textContent = n; this.el.left.textContent = left; }
  setModifier(text) { this.el.modifier.textContent = text || ''; }
  setTimer(text) { this.el.timer.textContent = text || ''; }
  setScore(score, combo) { this.el.score.textContent = score; this.el.combo.textContent = combo > 1 ? (this.i18n ? this.i18n.t('hud.combo', { combo }) : `hud.combo ${combo}`) : ''; }
  setWeapon(name, hint) { this.el.weapon.textContent = name; this.el.hint.textContent = hint || ''; }
  setTrainingTarget(target) {
    if (!this.el.trainingTarget) return;
    this.el.trainingTarget.hidden = !target;
    if (!target) return;
    this.el.trainingName.textContent = `${target.name} ${Math.ceil(target.hp)}/${target.maxHp}`;
    this.el.trainingFill.style.width = (Math.max(0, target.hp / target.maxHp) * 100).toFixed(1) + '%';
  }
  setBoss(name, frac) { if (frac == null) { this.el.bossbar.classList.remove('show'); return; } this.el.bossbar.classList.add('show'); this.el.bossname.textContent = name; this.el.bossfill.style.width = (Math.max(0, frac) * 100).toFixed(1) + '%'; }
  tip(text, dur = 5) { this.el.tip.innerHTML = text; this.el.tip.classList.add('show'); this._tipT = dur; }
  message(main, sub = '', dur = 2.2) { const m = this.el.msg; m.textContent = main; m.classList.remove('show'); void m.offsetWidth; m.classList.add('show'); this.el.msgsub.textContent = sub; this._msgT = dur; }
  kill(text, pts) {
    const d = document.createElement('div'); d.innerHTML = pts > 0 ? `${text} <span class="pts">+${pts}</span>` : text; this.el.killfeed.appendChild(d);
    setTimeout(() => d.remove(), 1700); while (this.el.killfeed.children.length > 6) this.el.killfeed.firstChild.remove();
  }
  damageFrom(angle) { const i = document.createElement('i'); i.style.transform = `rotate(${(angle * 180 / Math.PI).toFixed(1)}deg)`; this.el.dmg.appendChild(i); setTimeout(() => i.remove(), 1000); }
  showScreen(html) { this.el.panel.innerHTML = html; this.el.screen.classList.add('show'); }
  hideScreen() { this.el.screen.classList.remove('show'); }
  setGameplayVisible(v) { this.root.classList.toggle('nogame', !v); }
  update(dt) {
    if (this._msgT > 0) { this._msgT -= dt; if (this._msgT <= 0) { this.el.msg.classList.remove('show'); this.el.msgsub.textContent = ''; } }
    if (this._tipT > 0) { this._tipT -= dt; if (this._tipT <= 0) this.el.tip.classList.remove('show'); }
  }
}

export const KB_KEYS = { fire: 'LMB', aim: 'RMB', block: 'RMB', jump: 'Space', sprint: 'Shift', slide: 'C', dash: 'C', grapple: 'Q', melee: 'F', reload: 'R', grenade: 'G', focus: '左右键同按（或 X）', next: '滚轮', pause: 'Esc', confirm: 'Space', score: 'Tab' };
export const PAD_KEYS = { fire: 'R2', aim: 'L2', block: 'L2', jump: '✕', sprint: 'L3', slide: '○', dash: '○', grapple: 'L1', melee: 'R1', reload: '□', grenade: 'R3', focus: 'L2 + R2', next: '△', pause: 'Options', confirm: '✕', score: 'Create' };
export function controlsHTML(i18n) {
  const t = i18n.t.bind(i18n);
  return `<div class="cols" id="controls">
  <div><div class="colhead">${t('controls.mouseKeyboard')}</div>
    <div><b>WASD</b> ${t('controls.kbMove')}</div>
    <div><b>LMB</b> ${t('controls.kbFire')} &nbsp; <b>RMB</b> ${t('controls.kbAim')}</div>
    <div><b>Space</b> ${t('controls.kbJump')}</div>
    <div>${t('controls.kbDoubleJump')}</div>
    <div><b>C / Ctrl</b> ${t('controls.kbSlideDash')}</div>
    <div><b>Q / E</b> ${t('controls.kbGrapple')}</div>
    <div><b>F</b> ${t('controls.kbMelee')} &nbsp; <b>R</b> ${t('controls.reload')} &nbsp; <b>M</b> ${t('settings.music')}</div>
    <div><b>G</b> ${t('controls.grenade')}</div>
    <div><b>Tab</b> ${t('controls.scoreboard')} &nbsp; <b>Esc</b> ${t('controls.pause')}</div>
    <div><b>${t('controls.focusKey')}</b> ${t('controls.focus')}</div>
    <div><b>1-4 / ${t('controls.wheel')}</b> ${t('controls.weaponSwitch')}</div>
  </div>
  <div><div class="colhead">${t('controls.gamepad')}</div>
    <div><b>${t('controls.leftStick')}</b> ${t('controls.move')} &nbsp; <b>${t('controls.rightStick')}</b> ${t('controls.look')} &nbsp; <b>L3</b> ${t('controls.sprint')}</div>
    <div><b>R2</b> ${t('controls.kbFire')} &nbsp; <b>L2</b> ${t('controls.kbAim')}</div>
    <div><b>✕</b> ${t('controls.jump')} &nbsp; <b>○</b> ${t('controls.slideDash')}</div>
    <div><b>L1</b> ${t('controls.padGrapple')}</div>
    <div><b>L2 + R2</b> ${t('controls.focus')}</div>
    <div><b>R1</b> ${t('controls.padMelee')}</div>
    <div><b>□</b> ${t('controls.reload')} &nbsp; <b>△</b> ${t('controls.nextWeapon')}</div>
    <div><b>R3 / ${t('controls.dpadUp')}</b> ${t('controls.grenade')}</div>
    <div><b>Create</b> ${t('controls.scoreboard')} &nbsp; <b>Options</b> ${t('controls.pause')}</div>
  </div>
</div>`;
}
