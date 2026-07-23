import { useState }    from 'react';
import { useShallow }  from 'zustand/react/shallow';
import { useAppStore } from '../../store/vehicleStore';
import { Icon }        from '../ui/Icon';

type AirflowMode = 'face' | 'feet' | 'diffuse';
const AIRFLOW_MODES: { mode: AirflowMode; icon: 'airFace' | 'airFeet' | 'airBoth'; title: string }[] = [
  { mode: 'face',    icon: 'airFace', title: '吹脸' },
  { mode: 'feet',    icon: 'airFeet', title: '吹脚' },
  { mode: 'diffuse', icon: 'airBoth', title: '避免直吹' },
];

function FanBlocks({ level, onChange }: { level: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          onClick={() => onChange(i)}
          style={{
            width: 10, height: 10,
            background: i <= level ? 'var(--text)' : 'transparent',
            border: `1px solid ${i <= level ? 'var(--text)' : 'var(--border-light)'}`,
            cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'all 0.12s',
          }}
        />
      ))}
    </div>
  );
}

const SECTION_HEADER: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  background: 'var(--surface)',
  margin: '-8px -12px 6px',
  padding: '4px 12px',
};

export default function DriverZone() {
  const { climate, windows, seat, patchClimate, patchWindows, patchSeat } = useAppStore(
    useShallow(s => ({
      climate:      s.vehicle.climate,
      windows:      s.vehicle.windows,
      seat:         s.vehicle.seat,
      patchClimate: s.patchClimate,
      patchWindows: s.patchWindows,
      patchSeat:    s.patchSeat,
    }))
  );

  const [savedSeat, setSavedSeat] = useState<{ foreAft: number; recline: number } | null>(null);

  const toggleZeroGravity = () => {
    if (!seat.zeroGravity) {
      setSavedSeat({ foreAft: seat.foreAft, recline: seat.recline });
      patchSeat({ zeroGravity: true, foreAft: 100, recline: 170 });
    } else {
      patchSeat({ zeroGravity: false, ...(savedSeat ?? { foreAft: 50, recline: 110 }) });
      setSavedSeat(null);
    }
  };

  return (
    <div className="swiss-card" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── 空调 ── */}
      <div>
        <div style={SECTION_HEADER}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="ac" size={12} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>空调</span>
          </div>
          <button
            className={`swiss-chip${climate.acFront ? ' active' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => patchClimate({ acFront: !climate.acFront })}
          >
            {climate.acFront ? 'ON' : 'OFF'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 10 }}>
          {/* 左：风量 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span className="swiss-label">风量</span>
            <FanBlocks level={climate.fanSpeed} onChange={v => patchClimate({ fanSpeed: v })} />
          </div>

          {/* 中：温度 */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span className="swiss-label">温度</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => patchClimate({ tempFront: Math.max(16, climate.tempFront - 0.5) })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-3)', padding: '0 2px', lineHeight: 1 }}
              >−</button>
              <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {climate.tempFront.toFixed(1)}
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-3)', marginLeft: 1 }}>°C</span>
              </span>
              <button
                onClick={() => patchClimate({ tempFront: Math.min(30, climate.tempFront + 0.5) })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-3)', padding: '0 2px', lineHeight: 1 }}
              >+</button>
            </div>
          </div>

          {/* 右：风向 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span className="swiss-label">风向</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {AIRFLOW_MODES.map(({ mode, icon, title }) => (
                <button
                  key={mode}
                  title={title}
                  onClick={() => patchClimate({ airflowMode: mode })}
                  style={{
                    width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: climate.airflowMode === mode ? 'var(--text)' : 'transparent',
                    border: `1px solid ${climate.airflowMode === mode ? 'var(--text)' : 'var(--border-light)'}`,
                    color: climate.airflowMode === mode ? 'var(--bg)' : 'var(--text-3)',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  <Icon name={icon} size={11} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 窗户 + 座椅 并排（2×2 grid，标题同行等高）── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.7fr', gridTemplateRows: 'auto 1fr', border: '1px solid var(--border-light)', margin: '0 -12px -8px' }}>

        {/* 窗户 标题 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--surface)', padding: '4px 8px', borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
          <Icon name="window" size={12} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>窗户</span>
        </div>

        {/* 座椅 标题 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', padding: '4px 8px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="seat" size={12} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>座椅</span>
          </div>
          <button
            className={`swiss-chip${seat.zeroGravity ? ' accent' : ''}`}
            style={{ cursor: 'pointer', fontSize: 9 }}
            onClick={toggleZeroGravity}
          >
            {seat.zeroGravity ? '零重力 ON' : '零重力'}
          </button>
        </div>

        {/* 窗户 内容 */}
        <div style={{ borderRight: '1px solid var(--border-light)', padding: '6px 8px 10px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 52 }}>
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: `${100 - windows.driverWindow}%`,
              background: 'rgba(197, 228, 255, 0.5)',
              transition: 'height 0.25s ease',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <button
                onClick={() => patchWindows({ driverWindow: Math.max(0, windows.driverWindow - 50) })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2, lineHeight: 1 }}
              >
                <Icon name="winUp" size={16} />
              </button>
              <button
                onClick={() => patchWindows({ driverWindow: Math.min(100, windows.driverWindow + 50) })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2, lineHeight: 1 }}
              >
                <Icon name="winDown" size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 座椅 内容 */}
        <div style={{ padding: '4px 8px 10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
            <div>
              <div className="swiss-label" style={{ marginBottom: 2 }}>前后位置</div>
              <div style={{ fontSize: 11, fontWeight: 700 }}>
                {seat.foreAft < 50 ? '偏前' : seat.foreAft > 50 ? '偏后' : '居中'}
              </div>
            </div>
            <div>
              <div className="swiss-label" style={{ marginBottom: 2 }}>靠背角度</div>
              <div style={{ fontSize: 11, fontWeight: 700 }}>{seat.recline}°</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {([
              { icon: 'ventilation' as const, val: seat.ventilation !== 'off', action: () => patchSeat({ ventilation: seat.ventilation === 'off' ? 'low' : 'off' }), title: '通风' },
              { icon: 'heating'     as const, val: seat.heating,               action: () => patchSeat({ heating: !seat.heating }),                                    title: '加热' },
              { icon: 'massage'     as const, val: seat.massage,               action: () => patchSeat({ massage: !seat.massage }),                                    title: '按摩' },
            ]).map(({ icon, val, action, title }) => (
              <button
                key={icon}
                title={title}
                className={`swiss-btn${val ? ' filled' : ' outline'}`}
                style={{ flex: 1, padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={action}
              >
                <Icon name={icon} size={13} />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
