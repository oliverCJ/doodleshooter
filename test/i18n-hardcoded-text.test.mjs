import assert from 'node:assert/strict';
import fs from 'node:fs';

const FILES = [
  'src/main.js',
  'src/hud.js',
  'src/weapons.js',
  'src/enemies.js',
  'src/levels/registry.js',
  'src/training.js',
  'src/loadout.js',
];

const ALLOW = [
  /console\.(log|warn|info|error)/,
  /^\s*\/\//,
  /^\s*\/\*/,
  /^\s*\*/,
  /['"]zh['"]|['"]en['"]|['"]中文['"]|['"]English['"]|['"]PS5 手柄['"]|['"]LMB['"]|['"]RMB['"]|['"]Space['"]|['"]Shift['"]|['"]Esc['"]|['"]Tab['"]|['"]Create['"]|['"]Options['"]|['"]十字键上['"]|['"]左摇杆['"]|['"]右摇杆['"]|['"]左右键同按（或 X）['"]|['"]滚轮['"]/, 
];

const offenders = [];
for (const file of FILES) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    if (!/[\u4e00-\u9fff]/.test(line)) return;
    if (ALLOW.some((rule) => rule.test(line))) return;
    if (/i18n|t\(|nameKey|hintKey|deathNameKey|blurbKey|reasonKey|slot\./.test(line)) return;
    offenders.push(`${file}:${index + 1}: ${line.trim()}`);
  });
}

assert.deepEqual(offenders, [], `User-visible Chinese text should go through i18n:\n${offenders.join('\n')}`);
