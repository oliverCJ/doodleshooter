import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLobbyActions } from '../src/online/lobbyActions.js';

const LAN = 'lan-mode';
const PUBLIC = 'public-mode';

function makeDeps(overrides = {}) {
  const calls = [];
  const statusNode = { textContent: '' };
  const rowsNode = { innerHTML: '' };
  const lobby = { players: new Map(), hostId: null, isPublic: true, status: '', code: '', mapConfig: null, map: null, rejoinCode: null };
  const lobbyLists = { lan: null, public: null };
  const lobbyListBusy = { lan: false, public: false };
  let onlineTab = 'lan';
  let publicSignalingEnabled = true;
  let lanSignalingAvailable = true;
  let myName = 'Tester';
  let screen = 'main';
  const game = { state: 'start' };
  const net = {
    id: 'self-id',
    maxPlayers: 4,
    isHost: true,
    aliasCode: 'ALIAS',
    code: 'CODE1',
    isPublic: true,
    active: false,
    mode: LAN,
    peerOptions: { host: '127.0.0.1', port: 8910, path: '/peerjs', config: { iceServers: [] } },
    setMode(mode, loc, opts) { this.mode = mode; calls.push(['setMode', mode, loc, opts]); },
    async host(payload) { calls.push(['host', payload]); },
    async join(code, meta) { calls.push(['join', code, meta]); },
    async quickJoin(meta, setStatus) { calls.push(['quickJoin', meta]); if (setStatus) setStatus('quick status'); },
    async listLobbies(meta) { calls.push(['listLobbies', meta]); return [{ code: 'LAN01', players: 1, max: 4 }]; },
  };
  const deps = {
    net,
    lobby,
    lobbyLists,
    lobbyListBusy,
    i18n: { t: (key, values = {}) => values.reason ? `${key}:${values.reason}` : values.mode ? `${key}:${values.mode}` : key },
    hud: { el: { panel: { querySelector: (selector) => selector === '#status' ? statusNode : selector === '#lobbyRows' ? rowsNode : null } } },
    storage: { data: {}, setItem(key, value) { this.data[key] = value; } },
    location: { hostname: '192.168.1.10' },
    levels: [{ key: 'district' }],
    lanSignaling: LAN,
    publicSignaling: PUBLIC,
    checkLanSignaling: async () => true,
    writePublicSignalingEnabled: (storage, enabled) => { storage.setItem('public', enabled ? '1' : '0'); return enabled; },
    serializeMapConfig: () => ({ type: 'fixed', key: 'district' }),
    renderLobbyList: ({ mode }) => `<div>${mode}</div>`,
    mapHtml: () => '<div id="mapsel"></div>',
    getOnlineTab: () => onlineTab,
    setOnlineTab: (mode) => { onlineTab = mode; },
    getPublicSignalingEnabled: () => publicSignalingEnabled,
    setPublicSignalingEnabled: (enabled) => { publicSignalingEnabled = enabled; },
    getLanSignalingAvailable: () => lanSignalingAvailable,
    setLanSignalingAvailable: (enabled) => { lanSignalingAvailable = enabled; },
    getMyName: () => myName,
    setMyName: (value) => { myName = String(value).trim().slice(0, 14) || myName; },
    getLoadout: () => ['rifle', 'katana', 'shotgun', 'sniper'],
    getMapConfig: () => ({ type: 'fixed', key: 'district' }),
    setGameLobby: () => { game.state = 'lobby'; },
    setScreen: (value) => { screen = value; },
    showStart: () => calls.push(['showStart']),
    hostStart: () => calls.push(['hostStart']),
    requestHostStart: () => calls.push(['requestHostStart']),
    leaveOnline: (reason) => calls.push(['leaveOnline', reason]),
    wireMap: (handler) => calls.push(['wireMap', handler]),
    onMapPick: (config) => calls.push(['onMapPick', config]),
    lobbyRows: () => [{ id: 'self-id', name: myName }],
    ffaTarget: 20,
    logger: { info: (...args) => calls.push(['info', ...args]) },
    ...overrides,
  };
  return { deps, calls, lobby, lobbyLists, lobbyListBusy, statusNode, rowsNode, game, getScreen: () => screen };
}

{
  const { deps, calls } = makeDeps();
  const lobbyActions = createLobbyActions(deps);
  lobbyActions.useLanNetwork();
  assert.deepEqual(calls[0], ['setMode', LAN, deps.location, { allowStun: true }]);
  lobbyActions.usePublicNetwork();
  assert.deepEqual(calls.find((entry) => entry[0] === 'setMode' && entry[1] === PUBLIC), ['setMode', PUBLIC, undefined, undefined]);
}

{
  const { deps, lobby, statusNode } = makeDeps();
  createLobbyActions(deps).setStatus('hello');
  assert.equal(lobby.status, 'hello');
  assert.equal(statusNode.textContent, 'hello');
}

{
  const { deps, calls, lobby, game, getScreen } = makeDeps();
  await createLobbyActions(deps).createLobby(true);
  assert.deepEqual(calls.find((entry) => entry[0] === 'host'), ['host', { isPublic: true }]);
  assert.equal(lobby.isPublic, true);
  assert.deepEqual(lobby.mapConfig, { type: 'fixed', key: 'district' });
  assert.equal(lobby.map, 'district');
  assert.equal(lobby.players.get('self-id').name, 'Tester');
  assert.equal(lobby.hostId, 'self-id');
  assert.equal(game.state, 'lobby');
  assert.equal(getScreen(), 'lobby');
  assert.ok(calls.some((entry) => entry[0] === 'showStart'));
}

{
  const { deps, calls, lobby, game, getScreen } = makeDeps();
  await createLobbyActions(deps).joinLobby('ABC12');
  assert.deepEqual(calls.find((entry) => entry[0] === 'join'), ['join', 'ABC12', { name: 'Tester', loadout: ['rifle', 'katana', 'shotgun', 'sniper'] }]);
  assert.equal(lobby.status, '');
  assert.equal(game.state, 'lobby');
  assert.equal(getScreen(), 'lobby');
}

{
  const { deps, calls, lobby, game } = makeDeps();
  await createLobbyActions(deps).quickPlay();
  assert.ok(calls.some((entry) => entry[0] === 'quickJoin'));
  assert.equal(lobby.isPublic, true);
  assert.equal(game.state, 'lobby');
}

{
  const { deps, calls } = makeDeps();
  deps.net.quickJoin = async () => { throw new Error('no open public lobbies'); };
  await createLobbyActions(deps).quickPlay();
  assert.ok(calls.some((entry) => entry[0] === 'host'));
}

{
  const { deps, lobbyLists } = makeDeps();
  await createLobbyActions(deps).refreshLobbies('lan');
  assert.deepEqual(lobbyLists.lan, [{ code: 'LAN01', players: 1, max: 4 }]);
}

{
  const { deps, lobbyLists, rowsNode } = makeDeps();
  deps.setOnlineTab('public');
  deps.net.listLobbies = async () => { throw new Error('boom'); };
  await createLobbyActions(deps).refreshLobbies('public');
  assert.deepEqual(lobbyLists.public, []);
  assert.match(rowsNode.innerHTML, /lobby.searchFailed/);
}

{
  const { deps } = makeDeps();
  const lobbyActions = createLobbyActions(deps);
  deps.net.mode = LAN;
  assert.equal(lobbyActions.friendlyError(new Error('connection failed')), 'pvp.lanDirectFailed');
  deps.net.mode = PUBLIC;
  assert.equal(lobbyActions.friendlyError(new Error('connection failed')), 'online.status.peerDirectFailed');
  assert.equal(lobbyActions.friendlyError(new Error('full')), 'online.status.full');
  assert.equal(lobbyActions.friendlyError(Object.assign(new Error('version mismatch'), { details: { hostVersion: '1.1.1', clientVersion: '1.0.3' } })), 'online.status.versionMismatch');
}

{
  const { deps, lobbyLists } = makeDeps();
  const actions = createLobbyActions(deps).actions();
  actions.setName(' Alice ');
  assert.equal(createLobbyActions(deps).state().myName, 'Alice');
  actions.togglePublicSignaling(false);
  assert.equal(lobbyLists.public, null);
  assert.equal(createLobbyActions(deps).state().publicSignalingEnabled, false);
}

const source = readFileSync(new URL('../src/online/lobbyActions.js', import.meta.url), 'utf8');
assert.doesNotMatch(source, /three|\.\.\/net\.js|\.\.\/hud\.js|document|window|localStorage/);

console.log('lobby-actions tests passed');
