import { route } from '../router/index.ts';
import { handleTool } from '../tools/handlers.ts';
import { runAgentLoop, clearHistory } from '../agent/loop.ts';
import { vehicleState } from '../agent/vehicleState.ts';
import type { SSEPayload } from '../agent/loop.ts';
import type { VehicleState } from '../../shared/types.ts';
import type { EvalCase, EvalResult, ToolCall, CaseScores } from './types.ts';

// 记录初始状态，每条用例前重置
const INITIAL_STATE = JSON.parse(JSON.stringify(vehicleState)) as VehicleState;

function resetVehicleState(): void {
  const fresh = JSON.parse(JSON.stringify(INITIAL_STATE)) as VehicleState;
  (Object.keys(fresh) as Array<keyof VehicleState>).forEach((key) => {
    (vehicleState[key] as unknown) = fresh[key];
  });
}

// Mock emitter：收集 SSE 事件而不推送 HTTP
function createMockEmitter() {
  const toolsCalled: ToolCall[] = [];
  let hasIntentStep = false;
  let hasDecideStep = false;
  let finalMessage = '';

  const emit = (payload: SSEPayload) => {
    if (payload.type === 'reasoning') {
      const s = payload.step;
      if (s.type === 'tool_call' && s.toolName) {
        toolsCalled.push({ name: s.toolName, args: s.toolArgs ?? {} });
      }
      if (s.type === 'intent') hasIntentStep = true;
      if (s.type === 'decision') hasDecideStep = true;
    }
    if (payload.type === 'message') finalMessage = payload.content;
  };

  return { emit, get: () => ({ toolsCalled, hasIntentStep, hasDecideStep, finalMessage }) };
}

// 比较 expected args 子集与实际 args（partial match）
function argsMatch(expected: Record<string, unknown>, actual: Record<string, unknown>): boolean {
  return Object.entries(expected).every(([k, v]) => actual[k] === v);
}

function scoreCase(
  c: EvalCase,
  actualRoute: 'rule' | 'agent',
  toolsCalled: ToolCall[],
  hasIntentStep: boolean,
  hasDecideStep: boolean,
  latencyMs: number,
): CaseScores {
  // 路由是否正确
  const routeCorrect = actualRoute === c.route;

  // 工具命中率（按比例）
  const hitsCount = c.requiredTools.filter(
    (rt) => toolsCalled.some((tc) => tc.name === rt),
  ).length;
  const toolHit = c.requiredTools.length > 0 ? hitsCount / c.requiredTools.length : 1;

  // 参数正确率（仅针对设了 keyArgs 的用例）
  let paramCorrect: number | null = null;
  if (c.keyArgs) {
    const expectedArgs = c.keyArgs(INITIAL_STATE);
    // 在已命中的必要工具中找到第一个匹配工具的实际参数
    const relevantCalls = toolsCalled.filter((tc) =>
      c.requiredTools.includes(tc.name),
    );
    if (relevantCalls.length > 0) {
      const matched = relevantCalls.some((tc) => argsMatch(expectedArgs, tc.args));
      paramCorrect = matched ? 1 : 0;
    } else {
      paramCorrect = 0; // 没有调用必要工具，参数无从验证
    }
  }

  // 推理链完整率（仅 agent 路径）
  const chainComplete = c.route === 'agent' ? (hasIntentStep && hasDecideStep) : null;

  // 延迟达标
  const latencyOk = latencyMs <= c.latencyMs;

  // 音区路由准确率（keyArgs 中包含 zone 的用例）
  let zoneCorrect: boolean | null = null;
  if (c.keyArgs) {
    const expectedArgs = c.keyArgs(INITIAL_STATE);
    if ('zone' in expectedArgs) {
      const expectedZone = expectedArgs['zone'];
      const relevantCalls = toolsCalled.filter((tc) =>
        c.requiredTools.includes(tc.name),
      );
      if (relevantCalls.length > 0) {
        zoneCorrect = relevantCalls.some((tc) => tc.args['zone'] === expectedZone);
      } else {
        zoneCorrect = false;
      }
    }
  }

  return { toolHit, paramCorrect, chainComplete, latencyOk, zoneCorrect, routeCorrect };
}

export async function runCase(c: EvalCase): Promise<EvalResult> {
  resetVehicleState();
  clearHistory();

  const zone = c.zone ?? 'driver';
  let actualRoute: 'rule' | 'agent' = 'agent';
  let toolsCalled: ToolCall[] = [];
  let hasIntentStep = false;
  let hasDecideStep = false;
  let finalMessage = '';
  let errorMsg: string | undefined;

  const start = Date.now();

  try {
    const routeResult = route(c.input, vehicleState, zone);

    if (routeResult.path === 'rule') {
      actualRoute = 'rule';
      const { rule, args } = routeResult;
      toolsCalled = [{ name: rule.toolName, args }];
      const result = await handleTool(rule.toolName, args);
      finalMessage = result.message ?? '好的';
    } else {
      actualRoute = 'agent';
      const { emit, get } = createMockEmitter();
      await runAgentLoop(c.input, emit, zone);
      const captured = get();
      toolsCalled = captured.toolsCalled;
      hasIntentStep = captured.hasIntentStep;
      hasDecideStep = captured.hasDecideStep;
      finalMessage = captured.finalMessage;
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  const latencyMs = Date.now() - start;
  const scores = scoreCase(c, actualRoute, toolsCalled, hasIntentStep, hasDecideStep, latencyMs);

  // 通过条件：路由正确 + 所有必要工具均命中
  const passed = scores.routeCorrect && scores.toolHit === 1;

  return {
    caseId: c.id,
    caseName: c.name,
    category: c.category,
    expectedRoute: c.route,
    passed,
    scores,
    actualRoute,
    toolsCalled,
    latencyMs,
    finalMessage,
    error: errorMsg,
  };
}

// 回复质量检查
const FORBIDDEN_WORDS = ['为您', '非常抱歉', '当然可以', '很高兴'];
const MAX_MSG_LEN_SIMPLE = 15; // 单工具操作回复字数上限

export function checkResponseQuality(result: EvalResult, c: EvalCase): boolean {
  const msg = result.finalMessage;
  if (!msg) return true;
  if (FORBIDDEN_WORDS.some((w) => msg.includes(w))) return false;
  if (c.requiredTools.length === 1 && msg.length > MAX_MSG_LEN_SIMPLE) return false;
  return true;
}
