import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/deploy-cloudflare.yml', import.meta.url), 'utf8');

assert.match(workflow, /name:\s*Deploy Cloudflare Workers/);
assert.match(workflow, /workflow_dispatch:/, 'deployment should be manually triggered');
assert.doesNotMatch(workflow, /push:/, 'deployment should not auto-publish on push in this stage');
assert.match(workflow, /npm ci/);
assert.match(workflow, /node test\/version\.test\.mjs/);
assert.match(workflow, /node test\/net-version-compat\.test\.mjs/);
assert.match(workflow, /node test\/net-lan-public-discovery\.test\.mjs/);
assert.match(workflow, /node test\/lobby-actions\.test\.mjs/);
assert.match(workflow, /node test\/online-ui-state\.test\.mjs/);
assert.match(workflow, /node test\/i18n\.test\.mjs/);
assert.match(workflow, /npm run build/);
assert.match(workflow, /cloudflare\/wrangler-action@v4/);
assert.match(workflow, /wranglerVersion:\s*["']?4["']?/);
assert.match(workflow, /CLOUDFLARE_API_TOKEN/);
assert.match(workflow, /CLOUDFLARE_ACCOUNT_ID/);

console.log('deploy workflow tests passed');
