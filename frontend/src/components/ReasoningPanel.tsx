import { useRef, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store/vehicleStore';
import type { ReasoningStep } from '../types';

const LABEL: Record<string, string> = {
  intent:      '意图',
  plan:        '规划',
  decision:    '决策',
  tool_call:   '执行',
  tool_result: '结果',
  text:        '回复',
  thinking:    '推理',
  rule:        '规则',
};

const TOOL_DISPLAY: Record<string, string> = {
  get_car_state:        '读取车辆状态',
  set_temperature:      '调节温度',
  set_fan_speed:        '调节风量',
  set_ambient_light:    '调整氛围灯',
  play_music:           '播放音乐',
  set_volume:           '调节音量',
  adjust_seat:          '调整座椅',
  find_poi:             '搜索地点',
  set_navigation:       '设置导航',
  get_weather:          '查询天气',
  set_reminder:         '设置提醒',
  save_scene:           '保存场景',
  apply_scene:          '应用场景',
  list_scenes:          '查询场景列表',
  pause_music:          '暂停音乐',
  next_track:           '下一首',
  prev_track:           '上一首',
  set_repeat_mode:      '切换播放模式',
  like_track:           '收藏歌曲',
  set_ac:               '控制空调',
  set_air_circulation:  '切换内外循环',
  set_defrost:          '控制除霜',
  set_airflow_mode:     '调整出风方向',
  set_air_purifier:     '空气净化',
  set_fragrance:        '控制香氛',
  set_steering_heat:    '方向盘加热',
  set_temp_sync:        '同步前后排温度',
  set_climate_auto:     '自动空调模式',
  get_air_quality:      '查询空气质量',
  set_window:           '调节车窗',
  set_all_windows:      '全部车窗',
  set_sunroof:          '调节天窗',
  set_zero_gravity:     '零重力模式',
  set_seat_ventilation: '座椅通风',
  set_lumbar:           '调节腰托',
};

const ZONE_ZH: Record<string, string> = {
  front: '前排', rear: '后排', all: '全区',
  driver: '主驾', passenger: '副驾',
};

function formatArgs(args: Record<string, unknown>): string {
  return Object.entries(args)
    .map(([k, v]) => {
      if (typeof v === 'boolean') return `${k}: ${v ? '开启' : '关闭'}`;
      if (typeof v === 'string' && ZONE_ZH[v]) return `${k}: ${ZONE_ZH[v]}`;
      return `${k}: ${JSON.stringify(v)}`;
    })
    .join('  ');
}

function getMainContent(step: ReasoningStep): string {
  switch (step.type) {
    case 'plan':        return '任务规划';
    case 'tool_call':   return TOOL_DISPLAY[step.toolName ?? ''] ?? step.toolName ?? '执行操作';
    case 'tool_result': return '已获取数据';
    case 'text': return step.content ?? '';
    default: return step.content ?? '';
  }
}

function getSecondary(step: ReasoningStep): { text: string; isPlan: boolean } | null {
  if ((step.type === 'tool_call' || step.type === 'rule') && step.toolArgs && Object.keys(step.toolArgs).length > 0) {
    return { text: formatArgs(step.toolArgs), isPlan: false };
  }
  if (step.type === 'tool_result') {
    const t = step.content ?? '';
    return { text: t.length > 60 ? t.slice(0, 60) + '…' : t, isPlan: false };
  }
  if (step.type === 'plan') {
    return { text: step.content ?? '', isPlan: true };
  }
  return null;
}

const INIT_LINES = [
  '// 等待指令…',
  '// 规则 → 直接执行 · Agent → 意图 · 规划 · 决策 · 执行',
];

export default function ReasoningPanel() {
  const { reasoning, isAgentThinking } = useAppStore(
    useShallow(s => ({ reasoning: s.reasoning, isAgentThinking: s.isAgentThinking }))
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [reasoning]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="swiss-panel-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="panel-title">Agent 推理过程</span>
          <span className="panel-sub">Reasoning Chain</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isAgentThinking && (
            <span className="swiss-chip accent" style={{ fontSize: 9 }}>● 推理中</span>
          )}
          {!isAgentThinking && reasoning.length > 0 && (
            <span className="swiss-chip outline-accent" style={{ fontSize: 9 }}>推理完成</span>
          )}
        </div>
      </div>

      {/* Steps */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {reasoning.length === 0 ? (
          <div style={{ padding: '20px 16px' }}>
            {INIT_LINES.map((line, i) => (
              <div key={i} style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: '20px', fontFamily: 'monospace' }}>
                {line}
              </div>
            ))}
          </div>
        ) : (
          reasoning.map((step, i) => {
            const isLast    = i === reasoning.length - 1;
            const isRule    = step.type === 'rule';
            const label     = LABEL[step.type] ?? '推理';
            const main      = getMainContent(step);
            const secondary = getSecondary(step);

            return (
              <div key={i} className="reason-step scan-in">
                {/* 序号 */}
                <div className={`reason-num${isLast ? ' active' : ''}`}>{i + 1}</div>

                {/* 内容 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* 主行 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: secondary ? 4 : 0,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
                      {main}
                    </span>
                    <span
                      className="reason-type"
                      style={isRule ? { color: 'var(--accent)' } : undefined}
                    >
                      {label}
                    </span>
                  </div>

                  {/* 次要内容 */}
                  {secondary && (
                    secondary.isPlan ? (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                        {secondary.text.split(/[，,、\n]+/).filter(s => s.trim()).map((task, ti) => (
                          <span key={ti} style={{ marginRight: 10 }}>· {task.trim()}</span>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', lineHeight: 1.5 }}>
                        {secondary.text}
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
