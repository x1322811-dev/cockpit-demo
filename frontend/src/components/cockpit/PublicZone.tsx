import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../store/vehicleStore';
import { Icon }        from '../ui/Icon';
import { Heart }       from 'lucide-react';

const PRESET_COLORS = [
  { hex: '#00CED1', name: '冰晶青' },
  { hex: '#4A90D9', name: '晴空蓝' },
  { hex: '#9370DB', name: '薰衣紫' },
  { hex: '#FF8C00', name: '暖阳橙' },
  { hex: '#FF4500', name: '珊瑚红' },
  { hex: '#00C853', name: '翠玉绿' },
];

const MOCK_SEGMENTS = [
  { km: 8.2,  min: 14, road: '环城高速' },
  { km: 12.6, min: 22, road: '市区道路' },
  { km: 6.4,  min: 11, road: '快速路'   },
  { km: 9.8,  min: 17, road: '城市快速' },
];

function getColorName(hex: string) {
  return PRESET_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase())?.name ?? hex;
}

function hexDist(a: string, b: string): number {
  const p = (h: string) => { const v = parseInt(h.replace('#', ''), 16); return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff] as const; };
  const [r1, g1, b1] = p(a); const [r2, g2, b2] = p(b);
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

function nearestPreset(color: string): string {
  return PRESET_COLORS.reduce((best, c) => hexDist(color, c.hex) < hexDist(color, best) ? c.hex : best, PRESET_COLORS[0].hex);
}

function parseEtaMinutes(eta: string | null): number | null {
  if (!eta) return null;
  const m = eta.match(/(\d+)/);
  return m ? parseInt(m[1]) : null;
}

function computeArrivalTime(eta: string | null): string | null {
  const mins = parseEtaMinutes(eta);
  if (!mins) return null;
  const t = new Date(Date.now() + mins * 60000);
  return t.toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' });
}

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
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
            transition: 'all 0.12s',
          }}
        />
      ))}
    </div>
  );
}

function EqBars({ playing, onClick }: { playing: boolean; onClick: () => void }) {
  const heights = [0.5, 0.85, 0.4, 1.0, 0.6, 0.9, 0.35, 0.75, 0.55, 0.95, 0.45];
  return (
    <div
      onClick={onClick}
      title={playing ? '暂停' : '播放'}
      style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32, cursor: 'pointer' }}
    >
      {heights.map((h, i) => (
        <div
          key={i}
          className={`eq-bar${playing ? ' playing' : ''}`}
          style={{
            flex: 1,
            height: `${h * 100}%`,
            transition: 'transform 0.3s ease',
            ...(playing
              ? { animationDelay: `${i * 0.07}s`, animationPlayState: 'running' }
              : { animation: 'none', transform: 'scaleY(0.2)' }
            ),
          }}
        />
      ))}
    </div>
  );
}

function RouteNode({ icon, name, sub, iconColor, nameColor }: {
  icon: string; name: string; sub: string; iconColor: string; nameColor: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 10, color: iconColor, flexShrink: 0, marginTop: 2, lineHeight: 1 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: nameColor, lineHeight: 1.3 }}>{name}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{sub}</div>
      </div>
    </div>
  );
}

function SegmentLine({ km, min, road }: { km: number; min: number; road: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
      <div style={{ width: 10, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ width: 1, background: 'var(--border-light)', minHeight: 20 }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.8 }}>
        {km} km · {min} min · {road}
      </div>
    </div>
  );
}

export default function PublicZone() {
  const { media, ambientLight, windows, navigation, context, patchMedia, patchAmbientLight, patchWindows } =
    useAppStore(useShallow(s => ({
      media:             s.vehicle.media,
      ambientLight:      s.vehicle.ambientLight,
      windows:           s.vehicle.windows,
      navigation:        s.vehicle.navigation,
      context:           s.vehicle.context,
      patchMedia:        s.patchMedia,
      patchAmbientLight: s.patchAmbientLight,
      patchWindows:      s.patchWindows,
    })));

  const arrivalTime = computeArrivalTime(navigation.eta);
  const etaMin      = parseEtaMinutes(navigation.eta);
  const segCount    = navigation.stops.length + 1;
  const segments    = MOCK_SEGMENTS.slice(0, segCount);
  const totalDist   = Math.round(segments.reduce((s, seg) => s + seg.km, 0) * 10) / 10;
  const nowTime     = new Date().toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' });

  const volLevel = Math.round(media.volume / 20);

  // Playback mode helpers (single source of truth: media.repeatMode)
  const isSequence = media.repeatMode === 'sequence';
  const isShuffle  = media.repeatMode === 'shuffle';
  const isSingle   = media.repeatMode === 'single';

  // Sunroof: open=通透, shade=遮阳
  const isSunshade = windows.sunroof === 'shade';

  return (
    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 6 }}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, paddingLeft: 2 }}>
        <span style={{ width: 3, height: 13, background: 'var(--text)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700 }}>公域</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>SHARED SPACE</span>
      </div>

      {/* 4-column card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 0.75fr 2.4fr',
        border: '1px solid var(--border-light)',
      }}>

        {/* ══ 音乐 ══ */}
        <div style={{ padding: '10px 10px', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', margin: '-10px -10px 8px', padding: '4px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="music" size={13} />
              <span style={{ fontSize: 11, fontWeight: 700 }}>音乐</span>
            </div>
            <button
              onClick={() => patchMedia({ liked: !media.liked })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
            >
              <Heart
                size={16}
                strokeWidth={1.5}
                fill={media.liked ? 'var(--accent)' : 'none'}
                color={media.liked ? 'var(--accent)' : 'var(--text-3)'}
              />
            </button>
          </div>

          <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {media.trackName || '未播放'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
            {media.artist
              ? `${media.artist} · ${media.playing ? '正在播放' : '已暂停'}`
              : '—'}
          </div>

          {/* Middle section: EqBars + Volume, vertically centered */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
            <EqBars playing={media.playing} onClick={() => patchMedia({ playing: !media.playing })} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="volume" size={13} color="var(--text-3)" />
              <FanBlocks level={volLevel} onChange={lv => patchMedia({ volume: lv * 20 })} />
              <span style={{ fontSize: 10, minWidth: 22, textAlign: 'right', fontWeight: 600, color: 'var(--text-3)' }}>
                {media.volume}
              </span>
            </div>
          </div>

          {/* Playback mode — pinned to bottom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
            {([
              { name: 'listLoop'   as const, active: isSequence, action: () => patchMedia({ repeatMode: 'sequence' }), title: '列表顺序' },
              { name: 'shuffle'    as const, active: isShuffle,  action: () => patchMedia({ repeatMode: 'shuffle'  }), title: '随机播放' },
              { name: 'singleLoop' as const, active: isSingle,   action: () => patchMedia({ repeatMode: 'single'   }), title: '单曲循环' },
            ]).map(({ name, active, action, title }) => (
              <button
                key={name}
                className={`swiss-btn${active ? ' filled' : ' outline'}`}
                style={{ padding: '5px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={action}
                title={title}
              >
                <Icon name={name} size={12} />
              </button>
            ))}
          </div>
        </div>

        {/* ══ 氛围灯 ══ */}
        <div style={{ padding: '8px 10px', borderRight: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--surface)', margin: '-8px -10px 8px', padding: '4px 10px' }}>
            <Icon name="ambient" size={13} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>氛围灯</span>
          </div>

          {/* Vertical color bars */}
          <div style={{ display: 'flex', gap: 4, height: 88, marginBottom: 8 }}>
            {(() => {
              const activeHex = ambientLight.on ? nearestPreset(ambientLight.color) : null;
              return PRESET_COLORS.map(({ hex }) => {
                const isActive = hex.toLowerCase() === activeHex?.toLowerCase();
                return (
                <button
                  key={hex}
                  onClick={() => isActive
                    ? patchAmbientLight({ on: false })
                    : patchAmbientLight({ on: true, color: hex })
                  }
                  style={{
                    flex: 1,
                    background: hex,
                    opacity: isActive ? 1 : 0.22,
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'opacity 0.2s',
                  }}
                />
              );
              });
            })()}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>颜色</div>
              {ambientLight.on ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, background: ambientLight.color, border: '1px solid var(--border-light)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{getColorName(ambientLight.color)}</span>
                </div>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>—</span>
              )}
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>亮度</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: ambientLight.on ? 'var(--text)' : 'var(--text-muted)' }}>
                {ambientLight.on ? `${ambientLight.brightness}%` : '—'}
              </span>
            </div>
          </div>

        </div>

        {/* ══ 天窗 ══ */}
        <div style={{ padding: '8px 10px', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--surface)', margin: '-8px -10px 8px', padding: '4px 10px' }}>
            <Icon name="sunroof" size={13} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>天窗</span>
          </div>

          {/* Glass panel — color reflects sunroof state */}
          <div style={{
            flex: 1,
            background: isSunshade ? '#E0E0E0' : '#C5E4FF',
            marginBottom: 10,
            minHeight: 55,
            transition: 'background 0.3s',
          }} />

          {/* Two mutually exclusive buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              className={`swiss-btn${!isSunshade ? ' filled' : ' outline'}`}
              style={{ fontSize: 11, padding: '6px 0' }}
              onClick={() => patchWindows({ sunroof: 'open' })}
            >通透</button>
            <button
              className={`swiss-btn${isSunshade ? ' filled' : ' outline'}`}
              style={{ fontSize: 11, padding: '6px 0' }}
              onClick={() => patchWindows({ sunroof: 'shade' })}
            >遮阳</button>
          </div>
        </div>

        {/* ══ 导航 ══ */}
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', margin: '-8px -12px 10px', padding: '4px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="nav" size={13} />
              <span style={{ fontSize: 11, fontWeight: 700 }}>导航</span>
            </div>
            {arrivalTime && (
              <span className="swiss-chip accent" style={{ fontSize: 10, padding: '3px 10px' }}>
                预计到达 {arrivalTime}
              </span>
            )}
          </div>

          {navigation.destination ? (
            <div style={{ display: 'flex', flex: 1, gap: 0 }}>

              {/* Route timeline */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
                <RouteNode
                  icon="■"
                  name={context.location}
                  sub={`出发点 · ${nowTime}`}
                  iconColor="var(--text)"
                  nameColor="var(--text)"
                />
                {navigation.stops.map((stop, i) => (
                  <div key={`${stop}-${i}`}>
                    <SegmentLine km={segments[i]?.km ?? 8.2} min={segments[i]?.min ?? 14} road={segments[i]?.road ?? '市区道路'} />
                    <RouteNode
                      icon="□"
                      name={stop}
                      sub={(stop.includes('充电') || stop.includes('超充')) ? '途经点 · 补能 15 min' : '途经点'}
                      iconColor="var(--text-3)"
                      nameColor="var(--text)"
                    />
                  </div>
                ))}
                <SegmentLine
                  km={segments[navigation.stops.length]?.km ?? 12.6}
                  min={segments[navigation.stops.length]?.min ?? 22}
                  road={segments[navigation.stops.length]?.road ?? '市区道路'}
                />
                <RouteNode
                  icon="●"
                  name={navigation.destination}
                  sub={`目的地 · 预计 ${arrivalTime ?? navigation.eta ?? '—'} 抵达`}
                  iconColor="var(--accent)"
                  nameColor="var(--accent)"
                />
              </div>

              {/* Stats panel */}
              <div style={{
                borderLeft: '1px solid var(--border-light)',
                paddingLeft: 16,
                minWidth: 100,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 14,
                flexShrink: 0,
              }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 3 }}>剩余总距离</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{totalDist}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>km</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 3 }}>预计用时</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, color: 'var(--accent)' }}>
                      {etaMin ?? '—'}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>min</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                暂无导航 · 说"导航到…"即可启动
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
