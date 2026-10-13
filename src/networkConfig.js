import { SIGNALING_VERSION_LABEL } from './version.js';

export const DEFAULT_PUBLIC_SIGNALING = true;
export const PUBLIC_SIGNALING_KEY = 'doodle_public_signaling';
export const PUBLIC_SIGNALING = 'public';
export const LAN_SIGNALING = 'lan';
export const OFF_SIGNALING = 'off';

const LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1|\[::1\])$/;
const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

export function readPublicSignalingEnabled(storage = localStorage) {
  return storage.getItem(PUBLIC_SIGNALING_KEY) !== '0';
}

export function writePublicSignalingEnabled(storage = localStorage, enabled) {
  storage.setItem(PUBLIC_SIGNALING_KEY, enabled ? '1' : '0');
  return !!enabled;
}

export function prefixForMode(mode, hostname = location.hostname) {
  if (mode === LAN_SIGNALING) return `doodleshooter-${SIGNALING_VERSION_LABEL}-lan-`;
  return LOCAL_HOST_RE.test(hostname) ? `doodleshooter-${SIGNALING_VERSION_LABEL}-dev-` : `doodleshooter-${SIGNALING_VERSION_LABEL}-public-`;
}

export function peerOptionsForMode(mode, loc = location, options = {}) {
  if (mode === LAN_SIGNALING) {
    const secure = loc.protocol === 'https:';
    return {
      debug: 0,
      host: loc.hostname,
      port: Number(loc.port || (secure ? 443 : 80)),
      path: '/peerjs',
      secure,
      config: { iceServers: options.allowStun ? STUN_SERVERS : [] },
    };
  }
  return { debug: 0, config: { iceServers: STUN_SERVERS } };
}

export function isLanSignalingAvailable(payload) {
  return !!(payload && payload.ok === true && payload.mode === LAN_SIGNALING);
}

export async function checkLanSignaling(fetchFn = fetch) {
  try {
    const res = await fetchFn('/lan-health', { cache: 'no-store' });
    if (!res.ok) return false;
    return isLanSignalingAvailable(await res.json());
  } catch (e) {
    return false;
  }
}
