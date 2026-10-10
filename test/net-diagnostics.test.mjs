import assert from 'node:assert/strict';
import { Net } from '../src/net.js';

class FakePeer {
  constructor() {
    this.handlers = new Map();
    this.destroyed = false;
    queueMicrotask(() => this.handlers.get('open')?.('client-1'));
  }

  on(type, fn) {
    this.handlers.set(type, fn);
  }

  off(type) {
    this.handlers.delete(type);
  }

  emit(type, value) {
    this.handlers.get(type)?.(value);
  }

  destroy() {
    this.destroyed = true;
  }
}

class FakeConnection {
  constructor(peer = 'host-1') {
    this.peer = peer;
    this.metadata = { probe: true };
    this.open = false;
    this.handlers = new Map();
  }

  on(type, fn) {
    this.handlers.set(type, fn);
  }

  emit(type, value) {
    this.handlers.get(type)?.(value);
  }
}

global.window = { Peer: FakePeer };
global.location = { hostname: '192.168.1.20', protocol: 'http:', port: '8910' };

const net = new Net();
const diagnostics = [];
net.on('diagnostic', (event) => diagnostics.push(event));

const peer = await net._newPeer(null);
peer.emit('error', new Error('peer socket failed'));
assert.ok(diagnostics.some((event) => event.stage === 'peer' && event.message === 'peer socket failed'));

const conn = new FakeConnection();
net._watchConnection(conn, 'public-probe');
conn.emit('iceStateChanged', 'failed');
conn.emit('error', new Error('data channel failed'));
conn.emit('close');

assert.ok(diagnostics.some((event) => event.stage === 'public-probe' && event.type === 'ice' && event.state === 'failed'));
assert.ok(diagnostics.some((event) => event.stage === 'public-probe' && event.type === 'error' && event.message === 'data channel failed'));
assert.ok(diagnostics.some((event) => event.stage === 'public-probe' && event.type === 'close'));
