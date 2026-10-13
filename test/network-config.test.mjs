import assert from 'node:assert/strict';
import {
  DEFAULT_PUBLIC_SIGNALING,
  LAN_SIGNALING,
  readPublicSignalingEnabled,
  writePublicSignalingEnabled,
  peerOptionsForMode,
  prefixForMode,
  isLanSignalingAvailable,
} from '../src/networkConfig.js';
import { SIGNALING_VERSION_LABEL } from '../src/version.js';

function storage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
  };
}

assert.equal(DEFAULT_PUBLIC_SIGNALING, true);
assert.equal(LAN_SIGNALING, 'lan');

const s = storage();
assert.equal(readPublicSignalingEnabled(s), true);
writePublicSignalingEnabled(s, false);
assert.equal(readPublicSignalingEnabled(s), false);
writePublicSignalingEnabled(s, true);
assert.equal(readPublicSignalingEnabled(s), true);

assert.equal(prefixForMode('public', 'localhost'), `doodleshooter-${SIGNALING_VERSION_LABEL}-dev-`);
assert.equal(prefixForMode('public', 'example.com'), `doodleshooter-${SIGNALING_VERSION_LABEL}-public-`);
assert.equal(prefixForMode('lan', '192.168.1.20'), `doodleshooter-${SIGNALING_VERSION_LABEL}-lan-`);

const publicOptions = peerOptionsForMode('public', { hostname: 'game.example.com', protocol: 'https:' });
assert.ok(publicOptions.config.iceServers.length >= 1);
assert.equal(publicOptions.host, undefined);

const lanOptions = peerOptionsForMode('lan', { hostname: '192.168.1.20', protocol: 'http:', port: '8910' });
assert.equal(lanOptions.host, '192.168.1.20');
assert.equal(lanOptions.port, 8910);
assert.equal(lanOptions.path, '/peerjs');
assert.equal(lanOptions.secure, false);
assert.deepEqual(lanOptions.config.iceServers, []);

const lanAssistedOptions = peerOptionsForMode('lan', { hostname: '192.168.1.20', protocol: 'http:', port: '8910' }, { allowStun: true });
assert.ok(lanAssistedOptions.config.iceServers.length >= 1);

const lanOfflineOptions = peerOptionsForMode('lan', { hostname: '192.168.1.20', protocol: 'http:', port: '8910' }, { allowStun: false });
assert.deepEqual(lanOfflineOptions.config.iceServers, []);

assert.equal(isLanSignalingAvailable({ ok: true, mode: 'lan' }), true);
assert.equal(isLanSignalingAvailable(null), false);
