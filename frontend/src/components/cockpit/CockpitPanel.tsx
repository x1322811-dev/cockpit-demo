import { useState }    from 'react';
import { useAppStore } from '../../store/vehicleStore';
import DriverZone      from './DriverZone';
import PassengerZone   from './PassengerZone';
import PublicZone      from './PublicZone';

type DrivingState = 'parked' | 'slow' | 'medium' | 'fast';
const SPEEDS: { state: DrivingState; label: string; kmh: string }[] = [
  { state: 'parked', label: '驻车',  kmh: '0km/h'  },
  { state: 'slow',   label: '慢速',  kmh: '20km/h' },
  { state: 'medium', label: '中速',  kmh: '50km/h' },
  { state: 'fast',   label: '高速',  kmh: '80km/h' },
];
const SPEED_MAP: Record<DrivingState, number> = { parked: 0, slow: 20, medium: 50, fast: 80 };

function ZoneHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, paddingLeft: 2 }}>
      <span style={{ width: 3, height: 13, background: 'var(--text)', flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 700 }}>{title}</span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>{sub}</span>
    </div>
  );
}

export default function CockpitPanel() {
  const [drivingState, setDrivingState] = useState<DrivingState>('parked');
  const patchDrive = useAppStore(s => s.patchDrive);

  const handleSpeed = (state: DrivingState) => {
    setDrivingState(state);
    patchDrive({ speed: SPEED_MAP[state] });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Panel header */}
      <div className="swiss-panel-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="panel-title">座舱模拟区</span>
          <span className="panel-sub">Cockpit Twin</span>
        </div>

        {/* Speed selector */}
        <div style={{ display: 'flex', gap: 4 }}>
          {SPEEDS.map(({ state, label, kmh }) => (
            <button
              key={state}
              className={`speed-chip${drivingState === state ? ' active' : ''}`}
              onClick={() => handleSpeed(state)}
            >
              <span className="s-label">{label}</span>
              <span className="s-speed">{kmh}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Zone columns + public zone */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Dual zones */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <ZoneHeader title="主驾区" sub="Driver" />
            <DriverZone />
          </div>
          <div>
            <ZoneHeader title="副驾区" sub="Passenger" />
            <PassengerZone />
          </div>
        </div>

        {/* Shared public zone */}
        <PublicZone />
      </div>
    </div>
  );
}
