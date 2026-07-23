import assert from 'node:assert/strict';
import test from 'node:test';
import chatHandler from './netlify/functions/chat.mts';

test('Netlify chat function handles rule-routed SSE requests', async () => {
  const response = await chatHandler(new Request('https://example.netlify.app/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: '音量调到20',
      zone: 'driver',
      vehicleState: { media: { volume: 35 } },
    }),
  }));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/event-stream; charset=utf-8');

  const body = await response.text();
  assert.match(body, /"type":"reasoning"/);
  assert.match(body, /"toolName":"set_volume"/);
  assert.match(body, /"type":"vehicle_patch"/);
  assert.match(body, /"type":"done"/);
});

test('Netlify chat function clears history on DELETE', async () => {
  const response = await chatHandler(new Request('https://example.netlify.app/chat', {
    method: 'DELETE',
  }));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test('Netlify chat function returns SSE errors instead of HTTP 502 for agent failures', async () => {
  const originalKey = process.env.DEEPSEEK_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;

  try {
    const response = await chatHandler(new Request('https://example.netlify.app/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: '我有点冷，而且快没电了，找个能充电、顺便能吃辣的地方',
        zone: 'driver',
      }),
    }));

    assert.equal(response.status, 200);
    const body = await response.text();
    assert.match(body, /"type":"error"/);
    assert.match(body, /DEEPSEEK_API_KEY is not set/);
  } finally {
    if (originalKey) {
      process.env.DEEPSEEK_API_KEY = originalKey;
    }
  }
});
