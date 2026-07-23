import { useAppStore } from '../store/vehicleStore';
import { apiUrl } from '../config';

function computeChangedPaths(
  prev: Record<string, unknown>,
  curr: Record<string, unknown>,
  path = '',
): string[] {
  const result: string[] = [];
  for (const key of Object.keys(curr)) {
    const fullPath = path ? `${path}.${key}` : key;
    const pv = prev[key];
    const cv = curr[key];
    if (cv !== null && typeof cv === 'object' && !Array.isArray(cv)) {
      result.push(...computeChangedPaths(
        (pv ?? {}) as Record<string, unknown>,
        cv as Record<string, unknown>,
        fullPath,
      ));
    } else if (pv !== cv) {
      result.push(fullPath);
    }
  }
  return result;
}

// Plain async function — uses getState() so store access is always fresh
export async function sendChatMessage(text: string, zone: 'driver' | 'passenger' = 'driver'): Promise<void> {
  const s = () => useAppStore.getState();

  s().addMessage({ role: 'user', content: text, timestamp: new Date().toISOString(), zone });
  s().clearReasoning();
  s().takeSessionBase();
  s().setAgentThinking(true);

  try {
    const response = await fetch(apiUrl('/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, zone, vehicleState: s().vehicle }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const dataLine = part.split('\n').find(l => l.startsWith('data: '));
        if (!dataLine) continue;
        try {
          const payload = JSON.parse(dataLine.slice(6));
          switch (payload.type) {
            case 'reasoning':
              s().addReasoningStep(payload.step);
              break;
            case 'vehicle_patch': {
              const before = s().vehicle;
              s().updateVehicle(payload.patch);
              const after = s().vehicle;
              const changed = computeChangedPaths(
                before as unknown as Record<string, unknown>,
                after as unknown as Record<string, unknown>,
              );
              if (changed.length > 0) s().addAgentPatchedFields(changed);
              break;
            }
            case 'message':
              s().addMessage({
                role: 'assistant',
                content: payload.content,
                timestamp: new Date().toISOString(),
              });
              break;
            case 'error':
              s().addReasoningStep({ type: 'text', content: `✗ ${payload.message}` });
              break;
          }
        } catch {
          // malformed JSON — skip
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : '连接失败';
    s().addReasoningStep({ type: 'text', content: `✗ ${msg}` });
    s().addMessage({
      role: 'assistant',
      content: `连接后端失败：${msg}。请确认后端已启动（cd backend && npm run dev）。`,
      timestamp: new Date().toISOString(),
    });
  } finally {
    s().setAgentThinking(false);
  }
}
