import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

assert.match(main, /import \{ bindLobbyScreen, bindOnlineScreen, renderLobbyScreen, renderOnlineScreen \} from '\.\/screens\/onlineMenu\.js';/, 'main should consume the online menu module');
assert.match(main, /let onlineTab = 'lan'/, 'online UI should keep the selected network tab state');
assert.match(main, /lobbyLists = \{ public: null, lan: null \}/, 'public and LAN lobby lists should be stored separately');
assert.match(main, /renderOnlineScreen\(/, 'online screen rendering should be delegated to the screen module');
assert.match(main, /renderLobbyScreen\(/, 'lobby screen rendering should be delegated to the screen module');
assert.doesNotMatch(main, /function onlineHTML\(/, 'online HTML should not remain in main');
assert.doesNotMatch(main, /function lobbyHTML\(/, 'lobby HTML should not remain in main');
assert.match(main, /setMode\(LAN_SIGNALING, location, \{ allowStun: publicSignalingEnabled \}\)/, 'LAN mode should optionally use STUN assistance when public signaling is enabled');
assert.match(main, /i18n\.t\('pvp\.lanDirectFailed'\)/, 'LAN connection failures should explain that direct P2P setup failed');
assert.match(main, /\[network diagnostic\]/, 'LAN connection diagnostics should be visible in the browser console');
assert.doesNotMatch(main, /querySelectorAll\('button'\)\) b\.disabled = false/, 'unlockButtons should not blindly re-enable every button');
assert.doesNotMatch(main, /const ROSTER = \[/, 'wave roster should live in src/gameplay/waves.js');
assert.doesNotMatch(main, /const MODIFIERS = \[/, 'wave modifiers should live in src/gameplay/waves.js');
assert.doesNotMatch(main, /const bossFor = /, 'boss selection should live in src/gameplay/waves.js');
assert.match(main, /buildWavePlan\(/, 'main should call the wave rule module');
