import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');

assert.match(css, /\.main-shell\s*\{[^}]*position:\s*relative/s, 'main shell should anchor external bookmark tabs');
assert.match(css, /\.panel:has\(\.main-shell\)\s*\{[^}]*border:\s*0/s, 'main menu should not keep the outer panel border around external tabs');
assert.match(css, /\.panel:has\(\.main-shell\)\s*\{[^}]*background:\s*transparent/s, 'main menu outer panel should not draw a second paper window');
assert.doesNotMatch(css, /\.main-shell\s*\{[^}]*grid-template-columns:\s*116px/s, 'tabs should not reserve an internal grid column');
assert.match(css, /\.menu-tabs\s*\{[^}]*position:\s*absolute/s, 'menu tabs should be positioned outside the window body');
assert.match(css, /\.menu-tabs\s*\{[^}]*left:\s*calc\(-1 \* var\(--menu-tab-width\)/s, 'menu tabs should sit outside the left edge');
assert.match(css, /\.menu-content\s*\{[^}]*border:\s*2\.5px solid var\(--ink\)/s, 'menu content should be the visible paper window body');
