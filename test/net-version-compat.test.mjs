import assert from 'node:assert/strict';
import { Net } from '../src/net.js';
import { APP_VERSION, SIGNALING_VERSION } from '../src/version.js';

global.location = { hostname: '127.0.0.1', protocol: 'http:', port: '8910' };

class FakeConn {
  constructor(metadata = {}) {
    this.peer = 'client-peer';
    this.metadata = metadata;
    this.open = true;
    this.sent = [];
    this.closed = false;
    this.handlers = new Map();
  }

  on(type, fn) {
    this.handlers.set(type, fn);
  }

  off(type) {
    this.handlers.delete(type);
  }

  send(message) {
    this.sent.push(message);
  }

  close() {
    this.closed = true;
    this.open = false;
  }

  openNow() {
    this.handlers.get('open')?.();
  }
}

{
  const net = new Net();
  const meta = net.compatMetadata({ name: 'Alice' });
  assert.deepEqual(meta, { name: 'Alice', appVersion: APP_VERSION, signalingVersion: SIGNALING_VERSION });
}

{
  const net = new Net();
  net.isHost = true;
  net.id = 'host-peer';
  net.code = 'ABCDE';
  let joined = false;
  net.onPeerJoin = () => { joined = true; };
  const conn = new FakeConn({ appVersion: APP_VERSION, signalingVersion: SIGNALING_VERSION });
  net._incoming(conn);
  conn.openNow();
  assert.equal(joined, true, 'matching version should be seated');
  assert.equal(conn.closed, false, 'matching version connection should stay open');
  assert.equal(conn.sent[0].t, 'welcome');
}

{
  const net = new Net();
  net.isHost = true;
  net.id = 'host-peer';
  net.code = 'ABCDE';
  let joined = false;
  net.onPeerJoin = () => { joined = true; };
  const conn = new FakeConn({ appVersion: '0.0.9', signalingVersion: '0.0' });
  net._incoming(conn);
  conn.openNow();
  assert.equal(joined, false, 'mismatched version should not be seated');
  assert.equal(conn.sent[0].t, 'refused');
  assert.equal(conn.sent[0].d.reason, 'version mismatch');
  assert.equal(conn.sent[0].d.hostVersion, APP_VERSION);
  assert.equal(conn.sent[0].d.hostSignalingVersion, SIGNALING_VERSION);
  assert.equal(conn.sent[0].d.clientVersion, '0.0.9');
  assert.equal(conn.sent[0].d.clientSignalingVersion, '0.0');
  assert.equal(conn.closed, true, 'mismatched version connection should be closed');
}

console.log('net version compatibility tests passed');
