import assert from 'node:assert/strict';
import { Net } from '../src/net.js';
import { LAN_SIGNALING } from '../src/networkConfig.js';

const connectedIds = [];

class FakeConn {
  constructor(peer) {
    this.peer = peer;
    this.open = true;
    this.handlers = new Map();
  }

  on(type, fn) {
    this.handlers.set(type, fn);
  }

  close() {
    this.open = false;
    const fn = this.handlers.get('close');
    if (fn) fn();
  }
}

class FakePeer {
  constructor(id) {
    this.id = id || 'client-1';
    this.handlers = new Map();
    this.destroyed = false;
    queueMicrotask(() => this.handlers.get('open')?.(this.id));
  }

  on(type, fn) {
    this.handlers.set(type, fn);
  }

  off(type) {
    this.handlers.delete(type);
  }

  connect(id) {
    connectedIds.push(id);
    return new FakeConn(id);
  }

  destroy() {
    this.destroyed = true;
  }
}

global.window = { Peer: FakePeer };
global.location = { hostname: '192.168.1.20', protocol: 'http:', port: '8910' };

const net = new Net();
net.setMode(LAN_SIGNALING, global.location);

await assert.rejects(() => net.quickJoin(), /no open public lobbies/);
assert.ok(connectedIds.includes('doodlelan-PUB0'), 'LAN quickJoin should scan LAN public slots');
assert.ok(!connectedIds.some((id) => id.startsWith('doodledistrict-')), 'LAN quickJoin should not scan public internet prefix');

connectedIds.length = 0;
const lobbies = await net.listLobbies();
assert.deepEqual(lobbies, []);
assert.ok(connectedIds.includes('doodlelan-PUB0'), 'LAN listLobbies should scan LAN public slots');
