import assert from 'node:assert/strict';
import { renderMainMenu } from '../src/screens/mainMenu.js';
import { createI18n } from '../src/i18n.js';

const storage = { getItem: () => 'zh', setItem: () => {} };
const i18n = createI18n(storage);
const html = renderMainMenu({
  i18n,
  tab: 'start',
  levels: [
    { key: 'district', name: '涂鸦街区', blurb: '街道、屋顶与消防梯' },
    { key: 'training', name: '涂鸦训练场', blurb: '靶道、二层小楼、抓钩和跳台' },
  ],
  selectedMap: 'district',
  loadoutHtml: '<div id="loadout"></div>',
  throwablesHtml: '<div id="throwables"></div>',
  controlsHtml: '<div id="controls"></div>',
  settingsHtml: '<div id="settings"></div>',
  checkpointHtml: '',
  currentSettingsHtml: '<div class="current-settings">当前设置：涂鸦街区 · 步枪 / 太刀 · 手雷 x3</div>',
  bestHtml: '<div class="beststat">最高分：100</div>',
});

assert.match(html, /class="main-shell"/);
assert.match(html, /class="menu-tabs"/);
assert.match(html, /data-tab="start"/);
assert.match(html, /data-tab="settings"/);
assert.match(html, /data-tab="controls"/);
assert.match(html, /class="menu-content"/);
assert.match(html, /id="soloBtn"/);
assert.match(html, /id="gameSettingsBtn"/);
assert.match(html, /id="trainingBtn"/);
assert.match(html, /id="onlineBtn"/);
assert.match(html, /class="current-settings"/);
assert.match(html, /当前设置：涂鸦街区/);
assert.ok(html.indexOf('current-settings') < html.indexOf('beststat'), 'current settings should appear above the best score');
assert.doesNotMatch(html, /id="mapsel"/);
assert.doesNotMatch(html, /id="loadout"/);
assert.doesNotMatch(html, /id="throwables"/);
