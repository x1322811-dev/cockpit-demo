import CockpitPanel   from './components/cockpit/CockpitPanel';
import ReasoningPanel from './components/ReasoningPanel';
import StateDiff      from './components/StateDiff';
import ChatPanel      from './components/ChatPanel';

export default function App() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* ── Page header ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 18, height: 18,
          background: 'var(--accent)',
          flexShrink: 0,
        }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>
            智能座舱 Agent · 实时响应推理 Demo
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: 1 }}>
            Cockpit State → Intent → Plan → Reason → Decide → Execute
          </div>
        </div>
      </header>

      {/* ── 2-column layout, each column controls its own row split ── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '55fr 45fr',
        overflow: 'hidden',
      }}>
        {/* Left column: Cockpit shrinks to content / StateDiff fills rest */}
        <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: '0 0 auto', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
            <CockpitPanel />
          </div>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <StateDiff />
          </div>
        </div>

        {/* Right column: Reasoning 52 / Chat 48 */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 52, borderBottom: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ReasoningPanel />
          </div>
          <div style={{ flex: 48, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ChatPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
