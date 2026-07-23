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
