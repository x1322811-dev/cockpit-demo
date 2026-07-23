import { runAgentLoop, clearHistory, type SSEPayload } from '../../backend/agent/loop.ts';
import { syncVehicleState, vehicleState } from '../../backend/agent/vehicleState.ts';
import { handleTool } from '../../backend/tools/handlers.ts';
import { route } from '../../backend/router/index.ts';
import type { VehicleState } from '../../shared/types.ts';

const encoder = new TextEncoder();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function writeSse(controller: ReadableStreamDefaultController<Uint8Array>, payload: SSEPayload): void {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'DELETE') {
    clearHistory();
    return jsonResponse({ ok: true });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body: {
    message?: string;
    zone?: 'driver' | 'passenger';
    vehicleState?: Partial<VehicleState>;
  };

  try {
    body = await request.json();
  } catch (err) {
    console.error('Invalid /chat JSON body', err);
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { message, zone, vehicleState: frontendState } = body;

  if (frontendState) syncVehicleState(frontendState);

  if (!message?.trim()) {
    return jsonResponse({ error: '消息不能为空' }, 400);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (payload: SSEPayload) => writeSse(controller, payload);
      const resolvedZone = zone ?? 'driver';
      const routeResult = route(message, vehicleState, resolvedZone);

      if (routeResult.path === 'rule') {
        const { rule, args } = routeResult;
        try {
          emit({
            type: 'reasoning',
            step: { type: 'rule', content: rule.label, toolName: rule.toolName, toolArgs: args },
          });
          const toolResult = await handleTool(rule.toolName, args);
          emit({ type: 'reasoning', step: { type: 'tool_result', content: toolResult.message ?? '完成' } });
          if (toolResult.vehiclePatch) emit({ type: 'vehicle_patch', patch: toolResult.vehiclePatch });
          emit({ type: 'message', content: toolResult.message ?? '好的' });
          emit({ type: 'done' });
        } catch (err) {
          emit({ type: 'error', message: String(err) });
          emit({ type: 'done' });
        } finally {
          controller.close();
        }
        return;
      }

      try {
        await runAgentLoop(message, emit, resolvedZone);
      } catch (err) {
        console.error('Unhandled Agent loop error', err);
        emit({ type: 'error', message: err instanceof Error ? err.message : String(err) });
        emit({ type: 'done' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  });
}

export const config = {
  path: '/chat',
};
