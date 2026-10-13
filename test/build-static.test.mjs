import assert from 'node:assert/strict';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

rmSync(new URL('../dist/', import.meta.url), { recursive: true, force: true });

const result = spawnSync('npm', ['run', 'build'], {
  cwd: new URL('..', import.meta.url),
  encoding: 'utf8',
});

assert.equal(result.status, 0, result.stderr || result.stdout);

const required = [
  '../dist/index.html',
  '../dist/style.css',
  '../dist/src/main.js',
  '../dist/src/version.js',
  '../dist/vendor/peerjs/peerjs.min.js',
  '../dist/vendor/three/three.module.js',
];

for (const path of required) {
  assert.equal(existsSync(new URL(path, import.meta.url)), true, `${path} should exist in dist`);
}

const forbidden = [
  '../dist/docs',
  '../dist/test',
  '../dist/server',
  '../dist/serve.py',
  '../dist/Dockerfile',
  '../dist/docker-compose.yml',
  '../dist/README.md',
  '../dist/README.zh-CN.md',
  '../dist/CLAUDE.md',
  '../dist/package.json',
  '../dist/package-lock.json',
  '../dist/node_modules',
];

for (const path of forbidden) {
  assert.equal(existsSync(new URL(path, import.meta.url)), false, `${path} should not be published in dist`);
}

assert.deepEqual(readdirSync(new URL('../dist/', import.meta.url)).sort(), ['index.html', 'src', 'style.css', 'vendor']);
console.log('build-static tests passed');
