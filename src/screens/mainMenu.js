const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export const MAIN_MENU_TABS = ['start', 'settings', 'controls'];

export function renderMainMenu({ i18n, tab = 'start', levels = [], selectedMap = '', loadoutHtml = '', throwablesHtml = '', controlsHtml = '', settingsHtml = '', checkpointHtml = '', currentSettingsHtml = '', bestHtml = '' }) {
  const t = i18n.t.bind(i18n);
  const active = MAIN_MENU_TABS.includes(tab) ? tab : 'start';
  const tabs = MAIN_MENU_TABS.map((id) => `<button type="button" class="menu-tab${id === active ? ' on' : ''}" data-tab="${id}">${esc(t(`menu.${id}`))}</button>`).join('');
  return `<div class="main-shell"><nav class="menu-tabs">${tabs}</nav><div class="menu-content"><h1>${esc(t('app.title'))}</h1><h2>${esc(t('app.subtitle'))}</h2>${renderTabContent(active, { i18n, levels, selectedMap, loadoutHtml, throwablesHtml, controlsHtml, settingsHtml, checkpointHtml, currentSettingsHtml, bestHtml })}</div></div>`;
}

function renderTabContent(tab, data) {
  if (tab === 'settings') return `<section class="menu-page settings-page">${data.settingsHtml}</section>`;
  if (tab === 'controls') return `<section class="menu-page controls-page">${data.controlsHtml}</section>`;
  return renderStartPage(data);
}

function renderStartPage({ i18n, checkpointHtml, currentSettingsHtml, bestHtml }) {
  const t = i18n.t.bind(i18n);
  return `<section class="menu-page start-page"><div class="mainbtns"><button type="button" class="start" id="soloBtn">${esc(t('menu.startGame'))}<i>${esc(t('menu.startGameHint'))}</i></button><button type="button" id="gameSettingsBtn">${esc(t('menu.gameSettings'))}<i>${esc(t('menu.gameSettingsHint'))}</i></button><button type="button" id="trainingBtn">${esc(t('menu.training'))}<i>${esc(t('menu.trainingHint'))}</i></button><button type="button" id="onlineBtn">${esc(t('menu.online'))}<i>${esc(t('menu.onlineHint'))}</i></button></div>${currentSettingsHtml}${checkpointHtml}${bestHtml}</section>`;
}

function renderMapPicker(i18n, levels, selectedMap) {
  const t = i18n.t.bind(i18n);
  if (!levels || levels.length < 2) return '';
  return `<div class="mapsel" id="mapsel"><span class="mapsel-title">${esc(t('menu.map'))}</span><div class="map-options">${levels.map((m) => `<button type="button" class="mapbtn${m.key === selectedMap ? ' on' : ''}" data-map="${esc(m.key)}">${esc(m.name)}<i>${esc(m.blurb)}</i></button>`).join('')}</div></div>`;
}

export function bindMainMenuTabs(root, onTab) {
  const tabs = root.querySelector('.menu-tabs');
  if (!tabs) return;
  tabs.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-tab]');
    if (!button) return;
    event.stopPropagation();
    onTab(button.dataset.tab);
  });
}
