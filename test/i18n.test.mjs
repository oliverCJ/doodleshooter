import assert from 'node:assert/strict';
import { createI18n, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from '../src/i18n.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

assert.equal(DEFAULT_LANGUAGE, 'zh');
assert.deepEqual(SUPPORTED_LANGUAGES, ['zh', 'en']);
assert.equal(LANGUAGE_STORAGE_KEY, 'doodle_language');

const zh = createI18n(memoryStorage());
assert.equal(zh.lang, 'zh');
assert.equal(zh.t('menu.startGame'), '开始游戏');
assert.equal(zh.t('online.maxPlayers', { count: 10 }), '最多 10 名玩家');

const enStore = memoryStorage({ [LANGUAGE_STORAGE_KEY]: 'en' });
const en = createI18n(enStore);
assert.equal(en.lang, 'en');
assert.equal(en.t('menu.startGame'), 'Start Game');
assert.equal(en.t('online.maxPlayers', { count: 10 }), 'Up to 10 players');

en.setLanguage('zh');
assert.equal(en.lang, 'zh');
assert.equal(enStore.getItem(LANGUAGE_STORAGE_KEY), 'zh');

const invalid = createI18n(memoryStorage({ [LANGUAGE_STORAGE_KEY]: 'fr' }));
assert.equal(invalid.lang, 'zh');
assert.equal(invalid.t('missing.key'), 'missing.key');
