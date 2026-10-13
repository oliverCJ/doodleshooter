import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const entries = ['index.html', 'style.css', 'src', 'vendor'];
const required = [
  'index.html',
  'style.css',
  'src/main.js',
  'src/version.js',
  'vendor/peerjs/peerjs.min.js',
  'vendor/three/three.module.js',
];

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const entry of entries) {
  cpSync(join(root, entry), join(dist, entry), { recursive: true });
}

for (const path of required) {
  if (!existsSync(join(dist, path))) {
    console.error(`[build] Missing required asset: ${path}`);
    process.exit(1);
  }
}

console.log(`[build] Static assets written to ${dist}`);
