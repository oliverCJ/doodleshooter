// Online screens only render values supplied by the current state; escaping stays at this boundary.
const esc = (value) => String(value ?? '').replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);

function text(i18n, key, values) {
  return esc(i18n.t(key, values));
}

export function renderLobbyList({ i18n, state, mode }) {
  if (state.lobbyListBusy[mode]) return `<div class="hint">${text(i18n, 'lobby.finding')}</div>`;
  const list = state.lobbyLists[mode];
  if (!list) return `<div class="hint">${text(i18n, 'lobby.refreshHint')}</div>`;
  if (!list.length) return `<div class="hint">${text(i18n, 'lobby.quickJoinHint')}</div>`;
  return list.map((lobby) => {
    const host = lobby.hostName || i18n.t('pvp.someone');
    const players = `${lobby.players}/${lobby.max}`;
    const match = lobby.inMatch ? i18n.t('lobby.inMatch') : '';
    const join = lobby.full ? `<span class="status">${text(i18n, 'lobby.full')}</span>` : `<button type="button" data-join="${esc(lobby.code)}">${text(i18n, 'lobby.join')}</button>`;
    return `<div class="lobbyrow"><span class="code">${esc(lobby.code)}</span><span>${text(i18n, 'lobby.hostLobby', { host })}</span><span>${esc(players)}${esc(match)}</span>${join}</div>`;
  }).join('');
}

export function renderOnlineScreen({ i18n, state }) {
  const isLan = state.onlineTab === 'lan';
  const mode = isLan ? 'lan' : 'public';
  const enabled = isLan ? state.lanSignalingAvailable : state.publicSignalingEnabled;
  const disabled = enabled ? '' : 'disabled';
  const hint = isLan
    ? (state.lanSignalingAvailable ? text(i18n, 'online.lanHint') : text(i18n, 'online.lanUnavailableHint'))
    : (state.publicSignalingEnabled ? text(i18n, 'online.publicHint') : text(i18n, 'online.publicDisabledHint'));
  const title = isLan ? text(i18n, 'online.lanTab') : text(i18n, 'online.publicTab');
  const quickText = isLan ? text(i18n, 'online.quickLan') : text(i18n, 'online.quickPublic');
  const createText = isLan ? text(i18n, 'online.createLan') : text(i18n, 'online.createPublic');
  const codeLabel = isLan ? text(i18n, 'online.lanCode') : text(i18n, 'online.publicCode');
  const joinText = isLan ? text(i18n, 'online.joinLan') : text(i18n, 'online.joinPublic');
  const list = isLan || state.publicSignalingEnabled
    ? renderLobbyList({ i18n, state, mode })
    : `<div class="hint">${text(i18n, 'online.publicOff')}</div>`;
  const rejoin = state.lobby.rejoinCode
    ? `<div class="row"><button type="button" class="big" id="rejoinBtn">${text(i18n, 'lobby.rejoin', { code: state.lobby.rejoinCode })}</button></div>`
    : '';
  return `<h1>${text(i18n, 'online.title')}</h1><h2>${text(i18n, 'online.freeForAllSubtitle', { kills: state.ffaTarget, count: 10 })}</h2>
    <div class="online" id="online">
      <div class="row"><span>${text(i18n, 'online.name')}</span><input type="text" class="namebox" id="setName" maxlength="14" value="${esc(state.myName)}"></div>
      <div class="row"><label><input type="checkbox" id="publicSignalToggle" ${state.publicSignalingEnabled ? 'checked' : ''}> ${text(i18n, 'online.allowPublic')}</label><span class="hint">${text(i18n, 'online.allowPublicHint')}</span></div>
      <div class="nettabs"><button type="button" id="lanTab" class="${isLan ? 'on' : ''}">${text(i18n, 'online.lanTab')}</button><button type="button" id="publicTab" class="${!isLan ? 'on' : ''}">${text(i18n, 'online.publicTab')}</button></div>
      <div class="netpanel"><div class="row"><span>${title}</span></div><div class="hint">${hint}</div>
        <div class="row"><button type="button" class="big" id="quickBtn" ${disabled}>${quickText}</button><span class="hint">${text(i18n, 'online.quickHint')}</span></div>
        <div class="row"><button type="button" id="createBtn" ${disabled}>${createText}</button><div class="radio"><label><input type="radio" name="vis" value="public" ${state.lobby.isPublic ? 'checked' : ''} ${disabled}> ${text(i18n, 'common.public')}</label><label><input type="radio" name="vis" value="private" ${state.lobby.isPublic ? '' : 'checked'} ${disabled}> ${text(i18n, 'common.private')}</label></div></div>
        <div class="row"><span>${codeLabel}</span><input type="text" id="codeBox" placeholder="${text(i18n, 'online.codePlaceholder')}" maxlength="5" autocomplete="off" ${disabled}><button type="button" id="joinBtn" ${disabled}>${joinText}</button></div>
        <div class="lobbylist" id="lobbylist"><div class="row"><span>${text(i18n, 'online.publicLobbyList')}</span><button type="button" class="alt" id="refreshBtn" ${disabled}>${text(i18n, 'common.refresh')}</button></div><div class="rows" id="lobbyRows">${list}</div></div>
      </div>
      <div class="status" id="status">${esc(state.lobby.status)}</div>
      ${rejoin}
      <div class="row"><button type="button" class="alt" id="backBtn">${text(i18n, 'common.back')}</button></div>
    </div>`;
}

export function renderLobbyScreen({ i18n, state }) {
  const rows = state.players || [];
  const host = state.isHost;
  const mapConfig = state.lobby.mapConfig || state.lobby.map || state.mapConfig;
  const code = String(host ? (state.aliasCode || state.code) : (state.lobby.shown || state.code) || '').replace(/-\d+$/, '');
  return `<h1>${text(i18n, 'lobby.title')}</h1><h2>${text(i18n, 'online.freeForAllSubtitle', { kills: state.ffaTarget, count: state.maxPlayers })} · ${rows.length}/${state.maxPlayers}</h2>
    <div class="online" id="online">
      <div class="row"><span>${text(i18n, 'lobby.code')}</span><span class="code">${esc(code)}</span></div>
      ${state.mapHtml(mapConfig, host)}
      <div class="hint">${state.lobby.isPublic ? text(i18n, 'lobby.publicHint') : text(i18n, 'lobby.privateHint')}</div>
      <div class="plist">${rows.map((player) => `<div class="${player.id === state.lobby.hostId ? 'host' : ''}${player.id === state.selfId ? ' me' : ''}"><span>${esc(player.name)}</span><span>${player.id === state.selfId ? text(i18n, 'pvp.you') : ''}</span></div>`).join('')}</div>
      <div class="row"><button type="button" class="big" id="startBtn">${text(i18n, 'lobby.start')}</button><button type="button" class="alt" id="leaveBtn">${text(i18n, 'lobby.leave')}</button></div>
      <div class="status" id="status">${esc(state.lobby.status)}</div><div class="hint">${text(i18n, 'lobby.anyoneCanStart', { status: rows.length < 2 ? i18n.t('lobby.joinMidMatch') : i18n.t('lobby.playersReady', { count: rows.length }) })}</div>
    </div>`;
}

function bindRoot(root) {
  root.addEventListener('click', (event) => event.stopPropagation());
  root.addEventListener('keydown', (event) => event.stopPropagation());
}

function bindName(root, actions) {
  const input = root.querySelector('#setName');
  if (input) input.addEventListener('input', (event) => actions.setName(event.target.value));
}

function bindModeReady({ state, actions }) {
  if (state.onlineTab === 'lan' && !state.lanSignalingAvailable) {
    actions.setStatus('online.lanUnavailableHint');
    return false;
  }
  if (state.onlineTab === 'public' && !state.publicSignalingEnabled) {
    actions.setStatus('online.publicOff');
    return false;
  }
  if (state.onlineTab === 'lan') actions.useLanNetwork();
  else actions.usePublicNetwork();
  return true;
}

export function bindOnlineScreen(root, { state, actions }) {
  if (!root) return;
  bindRoot(root);
  bindName(root, actions);
  const query = (id) => root.querySelector(`#${id}`);
  const toggle = query('publicSignalToggle');
  if (toggle) toggle.addEventListener('change', (event) => actions.togglePublicSignaling(event.target.checked));
  const lanTab = query('lanTab');
  if (lanTab) lanTab.addEventListener('click', () => actions.setOnlineTab('lan'));
  const publicTab = query('publicTab');
  if (publicTab) publicTab.addEventListener('click', () => actions.setOnlineTab('public'));
  const quick = query('quickBtn');
  if (quick) quick.addEventListener('click', () => { if (bindModeReady({ state, actions })) { actions.lockButtons(root); actions.quickPlay(); } });
  const create = query('createBtn');
  if (create) create.addEventListener('click', () => {
    if (!bindModeReady({ state, actions })) return;
    const selected = root.querySelector('input[name=vis]:checked');
    actions.lockButtons(root);
    actions.createLobby(!selected || selected.value === 'public');
  });
  const code = query('codeBox');
  const join = () => {
    if (!bindModeReady({ state, actions })) return;
    const value = String(code?.value || '').trim().toUpperCase();
    if (!value) {
      actions.setStatus(state.onlineTab === 'lan' ? 'online.status.enterLanCode' : 'online.status.enterPublicCode');
      return;
    }
    actions.lockButtons(root);
    actions.joinLobby(value);
  };
  if (query('joinBtn')) query('joinBtn').addEventListener('click', join);
  if (code) code.addEventListener('keydown', (event) => { if (event.key === 'Enter') join(); });
  const rejoin = query('rejoinBtn');
  if (rejoin) rejoin.addEventListener('click', () => { actions.lockButtons(root); actions.rejoinLobby(state.lobby.rejoinCode); });
  const back = query('backBtn');
  if (back) back.addEventListener('click', () => actions.backToMain());
  const leave = query('leaveBtn');
  if (leave) leave.addEventListener('click', () => actions.leaveOnline(''));
  const refresh = query('refreshBtn');
  if (refresh) refresh.addEventListener('click', () => { if (bindModeReady({ state, actions })) actions.refreshLobbies(state.onlineTab); });
  const rows = query('lobbyRows');
  if (rows) rows.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-join]');
    if (!button || !bindModeReady({ state, actions })) return;
    actions.lockButtons(root);
    actions.joinLobby(button.dataset.join);
  });
  if (actions.refreshOnBind && (state.onlineTab === 'lan' ? state.lanSignalingAvailable : state.publicSignalingEnabled) && !state.lobbyLists[state.onlineTab] && !state.lobbyListBusy[state.onlineTab]) actions.refreshLobbies(state.onlineTab);
}

export function bindLobbyScreen(root, { state, actions }) {
  if (!root) return;
  bindRoot(root);
  if (actions.wireMap) actions.wireMap((config) => actions.onMapPick(config));
  const start = root.querySelector('#startBtn');
  if (start) start.addEventListener('click', () => { if (state.isHost) actions.hostStart(); else actions.requestHostStart(); });
  const leave = root.querySelector('#leaveBtn');
  if (leave) leave.addEventListener('click', () => actions.leaveOnline(''));
}
