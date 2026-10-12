const esc = (value) => String(value ?? '').replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);

export function createLobbyActions(deps) {
  const log = deps.logger || console;

  function currentMode() {
    return deps.getOnlineTab();
  }

  function currentName() {
    return deps.getMyName();
  }

  function setStatus(text) {
    deps.lobby.status = text;
    const el = deps.hud.el.panel.querySelector('#status');
    if (el) el.textContent = text;
  }

  function friendlyError(err) {
    const message = String(err && err.message || err || '');
    if (!message) return deps.i18n.t('online.status.genericError');
    if (/networking library/.test(message)) return deps.i18n.t('online.status.libraryError');
    if (/Negotiation of connection|could not connect|connection failed/i.test(message)) return deps.net.mode === deps.lanSignaling ? deps.i18n.t('pvp.lanDirectFailed') : deps.i18n.t('online.status.peerDirectFailed');
    if (/timed out|signalling/.test(message)) return deps.i18n.t('online.status.signalingFailed');
    if (/no lobby with that code/.test(message)) return deps.i18n.t('online.status.noLobbyCode');
    if (/no answer/.test(message)) return deps.i18n.t('online.status.noAnswer');
    if (/full/.test(message)) return deps.i18n.t('online.status.full');
    if (/leave the lobby/.test(message)) return deps.i18n.t('online.status.leaveFirst');
    return message;
  }

  function usePublicNetwork() {
    deps.net.setMode(deps.publicSignaling);
  }

  function useLanNetwork() {
    deps.net.setMode(deps.lanSignaling, deps.location, { allowStun: deps.getPublicSignalingEnabled() });
    log.info('[network] LAN PeerJS config', { host: deps.net.peerOptions.host, port: deps.net.peerOptions.port, path: deps.net.peerOptions.path, iceServers: deps.net.peerOptions.config.iceServers.length });
  }

  async function refreshLanSignaling() {
    const available = await deps.checkLanSignaling();
    deps.setLanSignalingAvailable(available);
    return available;
  }

  function lockButtons(root) {
    for (const button of root.querySelectorAll('button')) if (button.id !== 'backBtn') button.disabled = true;
  }

  function unlockButtons() {
    deps.showStart();
  }

  async function createLobby(isPublic) {
    setStatus(deps.i18n.t('online.status.creating'));
    try { await deps.net.host({ isPublic }); }
    catch (err) { setStatus(friendlyError(err)); unlockButtons(); return; }
    const mapConfig = deps.serializeMapConfig(deps.getMapConfig(), deps.levels);
    deps.lobby.isPublic = isPublic;
    deps.lobby.mapConfig = mapConfig;
    deps.lobby.map = mapConfig.key;
    deps.lobby.players.clear();
    deps.lobby.players.set(deps.net.id, { name: currentName(), loadout: deps.getLoadout().slice() });
    deps.lobby.hostId = deps.net.id;
    deps.lobby.status = '';
    deps.setGameLobby();
    deps.setScreen('lobby');
    deps.showStart();
  }

  async function joinLobby(code) {
    setStatus(deps.i18n.t('online.status.connecting'));
    try { await deps.net.join(code, { name: currentName(), loadout: deps.getLoadout() }); }
    catch (err) { setStatus(friendlyError(err)); unlockButtons(); return; }
    deps.lobby.isPublic = deps.net.isPublic;
    deps.lobby.status = '';
    deps.setGameLobby();
    deps.setScreen('lobby');
    deps.showStart();
  }

  async function quickPlay() {
    try {
      await deps.net.quickJoin({ name: currentName(), loadout: deps.getLoadout() }, setStatus);
      deps.lobby.isPublic = true;
      deps.lobby.status = '';
      deps.setGameLobby();
      deps.setScreen('lobby');
      deps.showStart();
      return;
    } catch (err) {
      if (!/no open public/.test(String(err.message))) { setStatus(friendlyError(err)); unlockButtons(); return; }
    }
    setStatus(deps.i18n.t('online.status.noOpenLobbyCreate', { mode: deps.net.mode === deps.lanSignaling ? deps.i18n.t('online.status.lanMode') : deps.i18n.t('online.status.publicMode') }));
    await createLobby(true);
  }

  async function refreshLobbies(mode = currentMode()) {
    if (deps.lobbyListBusy[mode] || deps.net.active) return;
    deps.lobbyListBusy[mode] = true;
    const box = deps.hud.el.panel.querySelector('#lobbyRows');
    if (box && mode === currentMode()) box.innerHTML = deps.renderLobbyList({ i18n: deps.i18n, state: state(), mode });
    let err = null;
    try {
      if (mode === 'lan') useLanNetwork(); else usePublicNetwork();
      deps.lobbyLists[mode] = await deps.net.listLobbies({ name: currentName() });
    } catch (error) {
      deps.lobbyLists[mode] = [];
      err = error;
    }
    deps.lobbyListBusy[mode] = false;
    const rows = deps.hud.el.panel.querySelector('#lobbyRows');
    if (rows && mode === currentMode()) rows.innerHTML = err ? `<div class="hint">${deps.i18n.t('lobby.searchFailed', { reason: esc(friendlyError(err)) })}</div>` : deps.renderLobbyList({ i18n: deps.i18n, state: state(), mode });
  }

  function state() {
    return {
      onlineTab: deps.getOnlineTab(),
      lanSignalingAvailable: deps.getLanSignalingAvailable(),
      publicSignalingEnabled: deps.getPublicSignalingEnabled(),
      lobby: deps.lobby,
      lobbyLists: deps.lobbyLists,
      lobbyListBusy: deps.lobbyListBusy,
      myName: currentName(),
      maxPlayers: deps.net.maxPlayers,
      ffaTarget: deps.ffaTarget,
      selfId: deps.net.id,
      isHost: deps.net.isHost,
      aliasCode: deps.net.aliasCode,
      code: deps.net.code,
      players: deps.lobbyRows(),
      mapConfig: deps.lobby.mapConfig || deps.lobby.map || deps.getMapConfig(),
      mapHtml: deps.mapHtml,
    };
  }

  function actions() {
    return {
      setName: (value) => deps.setMyName(value),
      togglePublicSignaling: (enabled) => { deps.setPublicSignalingEnabled(deps.writePublicSignalingEnabled(deps.storage, enabled)); deps.lobbyLists.public = null; deps.showStart(); },
      setOnlineTab: (mode) => { deps.setOnlineTab(mode); deps.showStart(); },
      setStatus: (key) => setStatus(deps.i18n.t(key)),
      quickPlay,
      createLobby,
      joinLobby,
      refreshLobbies,
      rejoinLobby: (code) => { deps.lobby.rejoinCode = null; joinLobby(code); },
      backToMain: () => { deps.lobby.status = ''; deps.lobby.rejoinCode = null; deps.setScreen('main'); deps.showStart(); },
      useLanNetwork,
      usePublicNetwork,
      lockButtons,
      leaveOnline: (reason) => { deps.lobby.rejoinCode = null; deps.leaveOnline(reason); },
      hostStart: deps.hostStart,
      requestHostStart: deps.requestHostStart,
      wireMap: deps.wireMap,
      onMapPick: deps.onMapPick,
      refreshOnBind: true,
    };
  }

  return { state, actions, createLobby, joinLobby, quickPlay, refreshLobbies, refreshLanSignaling, useLanNetwork, usePublicNetwork, setStatus, unlockButtons, friendlyError };
}
