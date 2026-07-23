import { useState, useRef, useEffect, useCallback } from 'react';
import { useShallow }    from 'zustand/react/shallow';
import { useAppStore }   from '../store/vehicleStore';
import { sendChatMessage } from '../hooks/useChat';
import { Icon }          from './ui/Icon';
import { apiUrl } from '../config';

async function resetConversation() {
  const s = useAppStore.getState;
  s().clearMessages();
  s().clearReasoning();
  await fetch(apiUrl('/chat'), { method: 'DELETE' }).catch(() => {});
}

const EXAMPLES = [
  { label: '多步规划', text: '我有点冷，而且快没电了，找个能充电、顺便能吃辣的地方' },
  { label: '场景模式', text: '切换到带娃长途自驾模式' },
  { label: '自动化规则', text: "记住，以后我说'下班回家'，就把空调开到24度、放爵士乐、导航回家" },
];

export default function ChatPanel() {
  const { messages, isAgentThinking } = useAppStore(
    useShallow(s => ({ messages: s.messages, isAgentThinking: s.isAgentThinking }))
  );
  const [driverInput,    setDriverInput]    = useState('');
  const [passengerInput, setPassengerInput] = useState('');
  const bottomRef       = useRef<HTMLDivElement>(null);
  const driverRef       = useRef<HTMLTextAreaElement>(null);
  const passengerRef    = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  useEffect(() => { autoResize(driverRef.current); },    [driverInput,    autoResize]);
  useEffect(() => { autoResize(passengerRef.current); }, [passengerInput, autoResize]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = (text: string, zone: 'driver' | 'passenger', clear: () => void) => {
    const t = text.trim();
    if (!t || isAgentThinking) return;
    clear();
    sendChatMessage(t, zone);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="swiss-panel-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="panel-title">对话区</span>
          <span className="panel-sub">Dual-Zone Dialog</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="swiss-chip" style={{ fontSize: 9 }}>双音区识别</span>
          <button
            onClick={resetConversation}
            disabled={isAgentThinking}
            style={{
              background: 'none', border: '1px solid var(--border-light)',
              cursor: isAgentThinking ? 'not-allowed' : 'pointer',
              color: 'var(--text-muted)', fontFamily: 'var(--font)',
              fontSize: 10, padding: '2px 8px',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            清空
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 ? (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              示例指令
            </div>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setDriverInput(ex.text)}
                style={{
                  display: 'block', width: '100%', background: 'none',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-3)', fontFamily: 'var(--font)',
                  fontSize: 11, padding: '7px 10px',
                  textAlign: 'left', cursor: 'pointer',
                  marginBottom: 5, transition: 'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-3)'; }}
              >
                <span style={{ color: 'var(--accent)', fontWeight: 700, marginRight: 8 }}>[{i + 1}]</span>
                <span style={{ color: 'var(--text-muted)', marginRight: 8, fontSize: 10 }}>{ex.label}</span>
                {ex.text}
              </button>
            ))}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'user' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  <div className="chat-user">{msg.content}</div>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    ■ {msg.zone === 'passenger' ? '副驾' : '主驾'} · {new Date(msg.timestamp).toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700 }}>座舱 Agent</span>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                      {new Date(msg.timestamp).toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="chat-agent">{msg.content}</div>
                </div>
              )}
            </div>
          ))
        )}
        {isAgentThinking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 10, fontWeight: 700 }}>座舱 Agent</span>
            <div className="chat-agent" style={{ color: 'var(--text-muted)' }}>推理中…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Dual-zone input */}
      <div style={{ borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-light)' }}>

          {/* Driver input */}
          <div style={{ padding: '8px 12px', borderRight: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <span style={{ width: 6, height: 6, background: 'var(--text)', flexShrink: 0 }} />
              <span className="swiss-label">主驾音区</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
              <textarea
                ref={driverRef}
                className="swiss-input"
                rows={1}
                value={driverInput}
                onChange={e => setDriverInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submit(driverInput, 'driver', () => setDriverInput('')))}
                placeholder="往这说话或输入指令…"
                disabled={isAgentThinking}
              />
              <button
                className="swiss-btn filled"
                style={{ padding: '4px 10px', fontSize: 11, flexShrink: 0 }}
                onClick={() => submit(driverInput, 'driver', () => setDriverInput(''))}
                disabled={!driverInput.trim() || isAgentThinking}
              >
                <Icon name="send" size={12} />
              </button>
            </div>
          </div>

          {/* Passenger input */}
          <div style={{ padding: '8px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <span style={{ width: 6, height: 6, background: 'var(--border-light)', border: '1px solid var(--border)', flexShrink: 0 }} />
              <span className="swiss-label">副驾音区</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
              <textarea
                ref={passengerRef}
                className="swiss-input"
                rows={1}
                value={passengerInput}
                onChange={e => setPassengerInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submit(passengerInput, 'passenger', () => setPassengerInput('')))}
                placeholder="副驾可独立下达指令…"
                disabled={isAgentThinking}
              />
              <button
                className="swiss-btn filled"
                style={{ padding: '4px 10px', fontSize: 11, flexShrink: 0 }}
                onClick={() => submit(passengerInput, 'passenger', () => setPassengerInput(''))}
                disabled={!passengerInput.trim() || isAgentThinking}
              >
                <Icon name="send" size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
