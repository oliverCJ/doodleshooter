import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  bindLobbyScreen,
  bindOnlineScreen,
  renderLobbyList,
  renderLobbyScreen,
  renderOnlineScreen,
} from '../src/screens/onlineMenu.js';

const i18n = {
  t(key, values = {}) {
    return values.code ? `${key}:${values.code}` : key;
  },
};

const state = {
  onlineTab: 'lan',
  lanSignalingAvailable: true,
  publicSignalingEnabled: true,
  lobby: { status: '', rejoinCode: null, isPublic: true, mapConfig: null, map: null, hostId: 'host' },
  lobbyLists: { lan: null, public: null },
  lobbyListBusy: { lan: false, public: false },
  myName: 'Tester',
  maxPlayers: 4,
  ffaTarget: 20,
  selfId: 'self',
  isHost: true,
  players: [{ id: 'host', name: 'Host' }, { id: 'self', name: 'Tester' }],
  mapConfig: { type: 'fixed', key: 'district' },
  mapHtml: () => '<div id="mapsel"></div>',
};

const actions = {
  setOnlineTab: () => {},
  togglePublicSignaling: () => {},
  quickPlay: () => {},
  createLobby: () => {},
  joinLobby: () => {},
  rejoinLobby: () => {},
  backToMain: () => {},
  refreshLobbies: () => {},
  setStatus: () => {},
  useLanNetwork: () => {},
  usePublicNetwork: () => {},
  hostStart: () => {},
  requestHostStart: () => {},
  leaveOnline: () => {},
  lockButtons: () => {},
  wireMap: () => {},
};

assert.match(renderOnlineScreen({ i18n, state, actions }), /id="online"/);
for (const id of ['setName', 'publicSignalToggle', 'lanTab', 'publicTab', 'quickBtn', 'createBtn', 'codeBox', 'joinBtn', 'refreshBtn', 'lobbyRows', 'backBtn']) {
  assert.match(renderOnlineScreen({ i18n, state, actions }), new RegExp(`id="${id}"`), `online screen should render ${id}`);
}
const lanUnavailableState = { ...state, onlineTab: 'lan', lanSignalingAvailable: false };
const lanUnavailableHtml = renderOnlineScreen({ i18n, state: lanUnavailableState, actions });
assert.match(lanUnavailableHtml, /online\.lanUnavailableHint/);
assert.match(lanUnavailableHtml, /id="quickBtn" disabled/);
assert.match(lanUnavailableHtml, /id="createBtn" disabled/);
assert.match(lanUnavailableHtml, /id="codeBox"[^>]*disabled/);
assert.match(lanUnavailableHtml, /id="joinBtn" disabled/);
assert.match(lanUnavailableHtml, /id="refreshBtn" disabled/);
assert.match(renderLobbyScreen({ i18n, state, actions }), /id="startBtn"/);
assert.match(renderLobbyScreen({ i18n, state, actions }), /id="leaveBtn"/);
assert.match(renderLobbyScreen({ i18n, state, actions }), /id="status"/);
assert.match(renderLobbyScreen({ i18n, state, actions }), /id="mapsel"/);
assert.match(renderLobbyList({ i18n, state, mode: 'lan' }), /lobby\.refreshHint/);

const source = readFileSync(new URL('../src/screens/onlineMenu.js', import.meta.url), 'utf8');
assert.doesNotMatch(source, /\.\.\/net\.js|from ['"]three['"]/);
assert.match(source, /data-join/);

const listeners = {};
const root = {
  querySelector(selector) {
    if (selector === '#online') return this;
    if (selector === '#lobbyRows') return { addEventListener: (type, fn) => { listeners[`rows:${type}`] = fn; } };
    if (selector === '#codeBox') return { addEventListener: (type, fn) => { listeners[`code:${type}`] = fn; }, value: '' };
    return { addEventListener: (type, fn) => { listeners[`${selector}:${type}`] = fn; } };
  },
  addEventListener(type, fn) { listeners[`root:${type}`] = fn; },
  querySelectorAll() { return []; },
};
bindOnlineScreen(root, { state, actions });
assert.ok(listeners['#quickBtn:click'] || listeners['#quickBtn:change'] || listeners['root:click']);

const lobbyRoot = {
  querySelector(selector) {
    if (selector === '#online') return this;
    return { addEventListener: (type, fn) => { listeners[`lobby:${selector}:${type}`] = fn; } };
  },
  addEventListener(type, fn) { listeners[`lobby:root:${type}`] = fn; },
};
bindLobbyScreen(lobbyRoot, { state, actions });
assert.ok(listeners['lobby:#startBtn:click']);

console.log('online-menu tests passed');
