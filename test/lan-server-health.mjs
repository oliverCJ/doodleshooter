import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { once } from 'node:events';

const RESOURCES = [
  '/',
  '/src/main.js',
  '/src/effects.js',
  '/vendor/three/three.module.js',
  '/vendor/peerjs/peerjs.min.js',
  '/lan-health',
];

async function freePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  server.close();
  await once(server, 'close');
  return port;
}

async function waitUntilReady(port, proc) {
  const deadline = Date.now() + 8000;
  let lastError = null;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) throw new Error(`lan server exited early with code ${proc.exitCode}`);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/lan-health`);
      if (res.ok) return;
    } catch (err) {
      lastError = err;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`lan server did not become ready: ${lastError && lastError.message}`);
}

async function fetchResource(port, path) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  const body = await res.arrayBuffer();
  return { path, status: res.status, size: body.byteLength, cache: res.headers.get('cache-control') || '' };
}

async function fetchText(port, path) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  const text = await res.text();
  return { path, status: res.status, text };
}

async function waitForExit(proc, timeoutMs) {
  if (proc.exitCode !== null) return proc.exitCode;
  return await Promise.race([
    once(proc, 'exit').then(([code]) => code),
    new Promise((_, reject) => setTimeout(() => reject(new Error('lan server did not exit after SIGINT')), timeoutMs)),
  ]);
}

const port = await freePort();
const proc = spawn(process.execPath, ['server/lan-server.js', '--host', '127.0.0.1', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

let stdout = '';
let stderr = '';
proc.stdout.on('data', (chunk) => { stdout += String(chunk); });
proc.stderr.on('data', (chunk) => { stderr += String(chunk); });

try {
  await waitUntilReady(port, proc);
  const results = await Promise.all(Array.from({ length: 12 }, () => RESOURCES).flat().map((path) => fetchResource(port, path)));
  for (const result of results) {
    assert.equal(result.status, 200, `${result.path} should return 200`);
    assert.ok(result.size > 0, `${result.path} should return a non-empty body`);
    if (result.path.startsWith('/vendor/')) assert.match(result.cache, /max-age/, `${result.path} should be cacheable`);
  }
  const peerId = await fetchText(port, '/peerjs/peerjs/id');
  assert.equal(peerId.status, 200, 'PeerJS id endpoint should return 200');
  assert.ok(!peerId.text.includes('<!DOCTYPE html>'), 'PeerJS id endpoint should not fall back to index.html');
  assert.ok(peerId.text.trim().length >= 8, 'PeerJS id endpoint should return a generated id');
  assert.match(stdout, /Local:/, 'server should print local URL');

  const lingeringSocket = net.createConnection({ host: '127.0.0.1', port });
  await once(lingeringSocket, 'connect');
  proc.kill('SIGINT');
  const exitCode = await waitForExit(proc, 1200);
  assert.equal(exitCode, 0, 'server should exit cleanly after SIGINT even while clients are connected');
  console.log('OK: LAN server health check passed');
} catch (err) {
  console.error(stdout);
  console.error(stderr);
  throw err;
} finally {
  if (proc.exitCode === null) proc.kill('SIGKILL');
}
