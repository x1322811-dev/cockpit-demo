import OpenAI from 'openai';
import { SYSTEM_PROMPT } from '../prompts/system.ts';
import { toolDefinitions } from '../tools/definitions.ts';
import { handleTool } from '../tools/handlers.ts';
import { vehicleState } from './vehicleState.ts';
import type { ReasoningStep, VehicleState } from '../../shared/types.ts';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is not set.');
  }

  client ??= new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  });

  return client;
}

const MAX_ITERATIONS = 8;
const TIMEOUT_MS = 30_000;

export type SSEPayload =
  | { type: 'reasoning'; step: ReasoningStep }
  | { type: 'vehicle_patch'; patch: Partial<VehicleState> }
  | { type: 'message'; content: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

type Emitter = (payload: SSEPayload) => void;

// Sliding window conversation history
const history: OpenAI.ChatCompletionMessageParam[] = [];
const MAX_HISTORY = 20;

export function clearHistory(): void {
  history.splice(0, history.length);
}

function parseStages(content: string): ReasoningStep[] {
  const steps: ReasoningStep[] = [];
  const intentM = content.match(/<intent>([\s\S]*?)<\/intent>/);
  const planM   = content.match(/<plan>([\s\S]*?)<\/plan>/);
  const decideM = content.match(/<decide>([\s\S]*?)<\/decide>/);

  if (intentM) steps.push({ type: 'intent',   content: intentM[1].trim() });
  if (planM)   steps.push({ type: 'plan',      content: planM[1].trim() });
  if (decideM) steps.push({ type: 'decision',  content: decideM[1].trim() });

  if (steps.length === 0) steps.push({ type: 'text', content });
  return steps;
}

export async function runAgentLoop(userMessage: string, emit: Emitter, zone: 'driver' | 'passenger' = 'driver'): Promise<void> {
  // Build messages: inject state into system context, then history + user message
  const stateSnapshot = `\n\n【当前车辆状态快照】\n注意：以下状态是只读参考，读到状态 ≠ 执行了操作，操控仍必须调用工具。\n${JSON.stringify(vehicleState, null, 2)}`;
  const zonePrefix = zone === 'passenger' ? '[副驾指令] ' : '';
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    ...history.slice(-MAX_HISTORY),
    { role: 'user', content: `${zonePrefix}${userMessage}` },
  ];

  let iterations = 0;
  let finalResponse = '';

  try {
    while (iterations < MAX_ITERATIONS) {
      iterations++;

      // Call DeepSeek with timeout
      const response = await Promise.race([
        getClient().chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT + stateSnapshot },
            ...messages,
          ],
          tools: toolDefinitions,
          tool_choice: 'auto',
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('LLM 响应超时（30s），请重试')), TIMEOUT_MS)
        ),
      ]);

      const choice = response.choices[0];
      const message = choice.message;

      // Emit text content as typed reasoning stages
      if (message.content) {
        for (const step of parseStages(message.content)) {
          emit({ type: 'reasoning', step });
        }
        finalResponse = message.content;
      }

      // No tool calls → done
      if (!message.tool_calls || message.tool_calls.length === 0) {
        if (finalResponse) emit({ type: 'message', content: finalResponse });
        break;
      }

      // Add assistant message (with tool_calls) to conversation
      messages.push({
        role: 'assistant',
        content: message.content ?? null,
        tool_calls: message.tool_calls,
      });

      // Execute each tool
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || '{}') as Record<string, unknown>;

        emit({
          type: 'reasoning',
          step: {
            type: 'tool_call',
            content: `调用 ${toolName}`,
            toolName,
            toolArgs,
          },
        });

        const result = await handleTool(toolName, toolArgs);

        const resultStr = result.data
          ? JSON.stringify(result.data, null, 2)
          : (result.message ?? '完成');

        if (result.data) {
          emit({ type: 'reasoning', step: { type: 'tool_result', content: resultStr } });
        }

        if (result.vehiclePatch) {
          emit({ type: 'vehicle_patch', patch: result.vehiclePatch });
        }

        // Feed result back into conversation
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: resultStr,
        });
      }
    }

    if (iterations >= MAX_ITERATIONS) {
      const notice = '⚠ 已达最大规划步数（8），停止执行。';
      emit({ type: 'reasoning', step: { type: 'text', content: notice } });
      emit({ type: 'message', content: notice });
    }

    // Persist to history
    history.push({ role: 'user', content: userMessage });
    if (finalResponse) history.push({ role: 'assistant', content: finalResponse });
    while (history.length > MAX_HISTORY) history.splice(0, 2);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emit({ type: 'reasoning', step: { type: 'text', content: `✗ ${msg}` } });
    emit({ type: 'error', message: msg });
  }

  emit({ type: 'done' });
}
