import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createApp } from './app.ts';

test('createApp exposes health, chat route, and static frontend fallback', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'cockpit-static-'));
  mkdirSync(path.join(root, 'assets'));
  writeFileSync(path.join(root, 'index.html'), '<main>Cockpit Demo</main>');
  writeFileSync(path.join(root, 'assets', 'app.js'), 'console.log("ok");');

  const app = createApp({ staticRoot: root });
  const server = app.listen(0);

  try {
    const address = server.address();
    assert(address && typeof address === 'object');
    const base = `http://127.0.0.1:${address.port}`;

    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, 'ok');

    const chatDelete = await fetch(`${base}/chat`, { method: 'DELETE' });
    assert.equal(chatDelete.status, 200);

    const staticAsset = await fetch(`${base}/assets/app.js`);
    assert.equal(staticAsset.status, 200);
    assert.equal(await staticAsset.text(), 'console.log("ok");');

    const spaFallback = await fetch(`${base}/demo/path`);
    assert.equal(spaFallback.status, 200);
    assert.equal(await spaFallback.text(), '<main>Cockpit Demo</main>');
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(err => (err ? reject(err) : resolve()));
    });
  }
});
