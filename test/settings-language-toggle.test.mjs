import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

assert.doesNotMatch(main, /id="setLang"/, 'language setting should not use a browser default select');
assert.match(main, /class="language-toggle"/, 'settings should render a game-style language toggle');
assert.match(main, /data-lang="zh"/, 'language toggle should include Chinese');
assert.match(main, /data-lang="en"/, 'language toggle should include English');
assert.match(main, /button\[data-lang\]/, 'language toggle should be wired through language buttons');
