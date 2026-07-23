import { Router } from 'express';
import { runAgentLoop, clearHistory } from '../agent/loop.ts';
import { syncVehicleState, vehicleState } from '../agent/vehicleState.ts';
import { handleTool } from '../tools/handlers.ts';
import { route } from '../router/index.ts';
import type { VehicleState } from '../../shared/types.ts';

export const chatRouter = Router();

chatRouter.post('/', async (req, res) => {
  const { message, zone, vehicleState: frontendState } = req.body as {
    message?: string;
    zone?: 'driver' | 'passenger';
    vehicleState?: Partial<VehicleState>;
  };

  if (frontendState) syncVehicleState(frontendState);

  if (!message?.trim()) {
    res.status(400).json({ error: '消息不能为空' });
    return;
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const emit = (payload: object) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const resolvedZone = zone ?? 'driver';

  // 规则引擎路由：命中则绕过 LLM，直接执行工具
  const routeResult = route(message, vehicleState, resolvedZone);

  if (routeResult.path === 'rule') {
    const { rule, args } = routeResult;
    try {
      emit({ type: 'reasoning', step: { type: 'rule', content: rule.label, toolName: rule.toolName, toolArgs: args } });
      const toolResult = await handleTool(rule.toolName, args);
      emit({ type: 'reasoning', step: { type: 'tool_result', content: toolResult.message ?? '完成' } });
      if (toolResult.vehiclePatch) emit({ type: 'vehicle_patch', patch: toolResult.vehiclePatch });
      emit({ type: 'message', content: toolResult.message ?? '好的' });
    } catch (err) {
      emit({ type: 'error', message: String(err) });
    }
    emit({ type: 'done' });
    res.end();
    return;
  }

  // Agent 路径
  try {
    await runAgentLoop(message, emit, resolvedZone);
  } catch (err) {
    emit({ type: 'error', message: String(err) });
    emit({ type: 'done' });
  }

  res.end();
});

chatRouter.delete('/', (_req, res) => {
  clearHistory();
  res.json({ ok: true });
});
