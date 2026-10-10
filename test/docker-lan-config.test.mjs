import assert from 'node:assert/strict';
import fs from 'node:fs';

const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
const compose = fs.readFileSync('docker-compose.yml', 'utf8');

assert.match(dockerfile, /^FROM node:/m, 'Docker image should include Node so it can run the local PeerJS signalling server');
assert.match(dockerfile, /npm ci --omit=dev/, 'Docker image should install runtime npm dependencies');
assert.match(dockerfile, /EXPOSE 8910/, 'Docker image should expose the LAN game server port');
assert.match(dockerfile, /CMD \["npm", "run", "serve"\]/, 'Docker image should start the same LAN server as npm run serve');

assert.match(compose, /"8910:8910"/, 'Docker compose should expose the LAN game server to other LAN devices');
assert.doesNotMatch(compose, /127\.0\.0\.1:/, 'Docker compose should not bind the game server to localhost only');
