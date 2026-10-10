import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

assert.match(main, /let onlineTab = 'lan'/, 'online UI should keep the selected network tab');
assert.match(main, /lobbyLists = \{ public: null, lan: null \}/, 'public and LAN lobby lists should be stored separately');
assert.match(main, /id="lanTab"/, 'online UI should render a LAN tab');
assert.match(main, /id="publicTab"/, 'online UI should render a public tab');
assert.match(main, /setMode\(LAN_SIGNALING, location, \{ allowStun: publicSignalingEnabled \}\)/, 'LAN mode should optionally use STUN assistance when public signaling is enabled');
assert.match(main, /局域网直连失败/, 'LAN connection failures should explain that direct P2P setup failed');
assert.match(main, /\[network diagnostic\]/, 'LAN connection diagnostics should be visible in the browser console');
assert.doesNotMatch(main, /querySelectorAll\('button'\)\) b\.disabled = false/, 'unlockButtons should not blindly re-enable every button');
