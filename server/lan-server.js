#!/usr/bin/env node
import express from 'express';
import { ExpressPeerServer } from 'peer';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const args = { host: '127.0.0.1', port: 8910 };
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (item === '--host') args.host = argv[++i] || args.host;
    else if (item === '--port') args.port = Number(argv[++i] || args.port);
    else if (item === '--lan') args.host = '0.0.0.0';
    else if (/^\d+$/.test(item)) args.port = Number(item);
  }
  if (!Number.isInteger(args.port) || args.port < 1 || args.port > 65535) throw new Error('port must be between 1 and 65535');
  return args;
}

function localIp() {
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const item of interfaces || []) {
      if (item.family === 'IPv4' && !item.internal) return item.address;
    }
  }
  return null;
}

function cacheHeaders(req, res, next) {
  if (req.path.startsWith('/vendor/')) res.setHeader('Cache-Control', 'public, max-age=3600');
  else res.setHeader('Cache-Control', 'no-store');
  next();
}

const args = parseArgs(process.argv.slice(2));
const app = express();
const server = http.createServer(app);
const openSockets = new Set();
const peerServer = ExpressPeerServer(server, {
  path: '/',
  proxied: false,
});

server.on('connection', (socket) => {
  openSockets.add(socket);
  socket.on('close', () => openSockets.delete(socket));
});

app.get('/lan-health', (req, res) => {
  res.json({ ok: true, peerPath: '/peerjs', mode: 'lan' });
});
app.use('/peerjs', peerServer);
app.use(cacheHeaders);
app.use(express.static(root, { extensions: ['html'] }));
app.use((req, res) => {
  res.sendFile(path.join(root, 'index.html'));
});

server.listen(args.port, args.host, () => {
  console.log(`Serving ${root}`);
  console.log(`Listening on ${args.host}:${args.port}`);
  console.log(`Local: http://127.0.0.1:${args.port}`);
  if (args.host === '0.0.0.0') {
    const ip = localIp();
    console.log(ip ? `LAN:   http://${ip}:${args.port}` : `LAN:   use your computer LAN IP with port ${args.port}`);
  }
  console.log('PeerJS: /peerjs');
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; closing LAN server and ${openSockets.size} client connection(s)`);
  server.close((err) => {
    if (err) {
      console.error(`LAN server shutdown failed: ${err.message}`);
      process.exit(1);
    }
    console.log('LAN server closed');
    process.exit(0);
  });
  // 浏览器和 PeerJS 可能持有长连接；退出服务时不能等待客户端主动断开。
  for (const socket of openSockets) socket.destroy();
  setTimeout(() => {
    console.error('LAN server shutdown timed out; forcing exit');
    process.exit(1);
  }, 3000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
