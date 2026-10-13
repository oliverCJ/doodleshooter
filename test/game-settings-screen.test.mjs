import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const i18n = readFileSync(new URL('../src/i18n.js', import.meta.url), 'utf8');
const menu = readFileSync(new URL('../src/screens/mainMenu.js', import.meta.url), 'utf8');

assert.match(main, /screen === 'gameSettings' \? gameSettingsHTML\(\)/, 'showStart should render a dedicated game settings screen');
assert.match(menu, /id="gameSettingsBtn"/, 'start page should expose a game settings entry button');
assert.match(main, /screen = 'gameSettings'/, 'game settings button should switch to the game settings screen');
assert.match(main, /function gameSettingsHTML\(\)/, 'game settings screen should have its own renderer');
assert.match(main, /class="game-settings-actions"/, 'game settings back action should have its own styled container');
assert.match(main, /id="gameSettingsBackBtn"/, 'game settings back button should not reuse the generic back button id');
assert.match(main, /wireGameSettings\(\)/, 'game settings screen should have dedicated wiring');
assert.match(main, /querySelector\('#gameSettingsBackBtn'\)/, 'game settings wiring should target the dedicated back button');
assert.match(i18n, /'menu\.gameSettings'/, 'game settings label should be localized');
assert.match(i18n, /'menu\.gameSettingsHint'/, 'game settings hint should be localized');
assert.match(i18n, /'menu\.currentSettings'/, 'current settings summary should be localized');
