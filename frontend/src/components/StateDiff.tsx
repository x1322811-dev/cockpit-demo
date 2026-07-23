import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store/vehicleStore';
import type { VehicleState } from '../types';
import { Icon, type IconName } from './ui/Icon';

interface DiffItem {
  icon: IconName;
  field: string;
  sub: string;
  oldVal: string;
  newVal: string;
}

function formatVal(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? '开启' : '关闭';
  if (Array.isArray(val)) return val.length === 0 ? '无' : `${val.length} 项`;
  if (typeof val === 'number') return String(val);
  return String(val);
}

const FIELD_META: Record<string, { icon: IconName; label: string; sub: string }> = {
  // ── 空调 ──
  'climate.tempFront':       { icon: 'ac',      label: '主驾·空调温度',   sub: '前排独立调节' },
  'climate.tempRear':        { icon: 'ac',      label: '副驾·空调温度',   sub: '后排独立调节' },
  'climate.fanSpeed':        { icon: 'ac',      label: '主驾·风量',       sub: '前排风量档位' },
  'climate.fanSpeedRear':    { icon: 'ac',      label: '副驾·风量',       sub: '后排风量档位' },
  'climate.acFront':         { icon: 'ac',      label: '主驾·空调',       sub: '压缩机开关' },
  'climate.acRear':          { icon: 'ac',      label: '副驾·空调',       sub: '压缩机开关' },
  'climate.airCirculation':  { icon: 'ac',      label: '空气循环',        sub: '内外循环模式' },
  'climate.defrostFront':    { icon: 'ac',      label: '前挡除霜',        sub: '除霜功能' },
  'climate.airflowMode':     { icon: 'ac',      label: '主驾·风向',       sub: '吹脸/吹脚/避免直吹' },
  'climate.airflowModeRear': { icon: 'ac',      label: '副驾·风向',       sub: '吹脸/吹脚/避免直吹' },
  'climate.airPurifier':     { icon: 'ac',      label: '空气净化',        sub: '净化等级' },
  'climate.fragrance':       { icon: 'ac',      label: '车内香氛',        sub: '香氛模式' },
  'climate.steeringHeat':    { icon: 'ac',      label: '方向盘加热',      sub: '加热开关' },
  'climate.autoMode':        { icon: 'ac',      label: '空调自动模式',    sub: '全自动控制' },
  'climate.tempSync':        { icon: 'ac',      label: '温度同步',        sub: '副驾跟随主驾' },
  // ── 音乐 ──
  'media.playing':           { icon: 'music',   label: '音乐播放',        sub: '播放状态' },
  'media.genre':             { icon: 'music',   label: '音乐风格',        sub: '当前播放曲风' },
  'media.volume':            { icon: 'volume',  label: '音量',            sub: '音量调节' },
  'media.trackName':         { icon: 'music',   label: '当前曲目',        sub: '正在播放' },
  'media.artist':            { icon: 'music',   label: '艺术家',          sub: '当前曲目' },
  'media.repeatMode':        { icon: 'music',   label: '循环模式',        sub: '顺序/随机/单曲' },
  'media.liked':             { icon: 'music',   label: '收藏状态',        sub: '当前曲目' },
  // ── 氛围灯 ──
  'ambientLight.on':         { icon: 'ambient', label: '氛围灯',          sub: '开关状态' },
  'ambientLight.color':      { icon: 'ambient', label: '氛围灯颜色',      sub: '颜色设置' },
  'ambientLight.brightness': { icon: 'ambient', label: '氛围灯亮度',      sub: '亮度调节' },
  'ambientLight.mode':       { icon: 'ambient', label: '氛围灯动效',      sub: '静态/呼吸/流动' },
  // ── 主驾座椅 ──
  'seat.zeroGravity':        { icon: 'seat',    label: '主驾·零重力',     sub: '零重力模式' },
  'seat.foreAft':            { icon: 'seat',    label: '主驾·座椅位置',   sub: '前后位置' },
  'seat.recline':            { icon: 'seat',    label: '主驾·靠背角度',   sub: '靠背角度' },
  'seat.massage':            { icon: 'seat',    label: '主驾·按摩',       sub: '座椅按摩' },
  'seat.heating':            { icon: 'seat',    label: '主驾·座椅加热',   sub: '加热开关' },
  'seat.ventilation':        { icon: 'seat',    label: '主驾·座椅通风',   sub: '通风等级' },
  'seat.lumbar':             { icon: 'seat',    label: '主驾·腰托',       sub: '腰托强度' },
  // ── 副驾座椅 ──
  'seatPassenger.zeroGravity':  { icon: 'seat', label: '副驾·零重力',     sub: '零重力模式' },
  'seatPassenger.foreAft':      { icon: 'seat', label: '副驾·座椅位置',   sub: '前后位置' },
  'seatPassenger.recline':      { icon: 'seat', label: '副驾·靠背角度',   sub: '靠背角度' },
  'seatPassenger.massage':      { icon: 'seat', label: '副驾·按摩',       sub: '座椅按摩' },
  'seatPassenger.heating':      { icon: 'seat', label: '副驾·座椅加热',   sub: '加热开关' },
  'seatPassenger.ventilation':  { icon: 'seat', label: '副驾·座椅通风',   sub: '通风等级' },
  'seatPassenger.lumbar':       { icon: 'seat', label: '副驾·腰托',       sub: '腰托强度' },
  // ── 车窗 ──
  'windows.driverWindow':    { icon: 'window',  label: '主驾·车窗',       sub: '车窗开度' },
  'windows.passengerWindow': { icon: 'window',  label: '副驾·车窗',       sub: '车窗开度' },
  'windows.rearLeftWindow':  { icon: 'window',  label: '后排左窗',        sub: '车窗开度' },
  'windows.rearRightWindow': { icon: 'window',  label: '后排右窗',        sub: '车窗开度' },
  'windows.sunroof':         { icon: 'sunroof', label: '天窗',            sub: '通透/遮阳' },
  // ── 导航 ──
  'navigation.destination':  { icon: 'nav',     label: '导航目的地',      sub: '目的地设置' },
  'navigation.eta':          { icon: 'nav',     label: '预计用时',        sub: '预计到达时间' },
  'navigation.stops':        { icon: 'nav',     label: '途经点',          sub: '途经地点列表' },
  // ── 提醒 ──
  'reminders':               { icon: 'nav',     label: '提醒事项',        sub: '已添加提醒' },
};

function extractDiffs(
  prev: VehicleState | null,
  curr: VehicleState,
  allowedPaths: Set<string>,
): DiffItem[] {
  if (!prev || allowedPaths.size === 0) return [];
  const items: DiffItem[] = [];

  function compare(path: string, prevObj: Record<string, unknown>, currObj: Record<string, unknown>) {
    for (const key of Object.keys(currObj)) {
      const fullPath = path ? `${path}.${key}` : key;
      const pv = prevObj[key];
      const cv = currObj[key];
      if (cv !== null && typeof cv === 'object' && !Array.isArray(cv)) {
        compare(fullPath, (pv ?? {}) as Record<string, unknown>, cv as Record<string, unknown>);
      } else if (pv !== cv && allowedPaths.has(fullPath)) {
        const meta = FIELD_META[fullPath];
        if (meta) {
          items.push({
            icon:   meta.icon,
            field:  meta.label,
            sub:    meta.sub,
            oldVal: formatVal(pv),
            newVal: formatVal(cv),
          });
        }
      }
    }
  }

  compare('', prev as unknown as Record<string, unknown>, curr as unknown as Record<string, unknown>);
  return items;
}

export default function StateDiff() {
  const { vehicle, sessionBase, agentPatchedFields, isAgentThinking } = useAppStore(
    useShallow(s => ({
      vehicle:             s.vehicle,
      sessionBase:         s.sessionBase ?? null,
      agentPatchedFields:  s.agentPatchedFields,
      isAgentThinking:     s.isAgentThinking,
    }))
  );

  const diffs = extractDiffs(
    sessionBase as VehicleState | null,
    vehicle,
    new Set(agentPatchedFields),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="swiss-panel-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="panel-title">状态变化展示</span>
          <span className="panel-sub">State Diff</span>
        </div>
        {diffs.length > 0 && (
          <span className="swiss-label-accent">本轮变更 {diffs.length} 项</span>
        )}
      </div>

      {/* Diff list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {diffs.length === 0 ? (
          <div style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: 11 }}>
            {isAgentThinking ? 'Agent 执行中，状态即将更新…' : '暂无状态变更 · 发送指令后将显示变更内容'}
          </div>
        ) : (
          diffs.map((d, i) => (
            <div key={i} className="diff-row" style={{ padding: '7px 16px' }}>
              <span style={{ color: 'var(--text-muted)', width: 16, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <Icon name={d.icon} size={13} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{d.field}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span className="diff-old">{d.oldVal}</span>
                <span className="diff-arrow">→</span>
                <span className="diff-new">{d.newVal}</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
