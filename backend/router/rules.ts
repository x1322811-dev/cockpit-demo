import type { VehicleState } from '../../shared/types.ts';

export interface Rule {
  id: string;
  label: string;
  patterns: RegExp[];
  toolName: string;
  buildArgs: (
    match: RegExpMatchArray,
    state: VehicleState,
    zone: 'driver' | 'passenger'
  ) => Record<string, unknown>;
}

function toFR(zone: 'driver' | 'passenger'): 'front' | 'rear' {
  return zone === 'passenger' ? 'rear' : 'front';
}

function toDP(zone: 'driver' | 'passenger'): 'driver' | 'passenger' {
  return zone;
}

export const RULES: Rule[] = [

  // ── 音乐基础控制 ──────────────────────────────────────────────────────────
  {
    id: 'pause',
    label: '暂停音乐',
    patterns: [/暂停|停一下|停下|停播/],
    toolName: 'pause_music',
    buildArgs: () => ({}),
  },
  {
    id: 'next',
    label: '下一首',
    patterns: [/下一首|切下一首|切歌|换一首|跳过这首|跳过/],
    toolName: 'next_track',
    buildArgs: () => ({}),
  },
  {
    id: 'prev',
    label: '上一首',
    patterns: [/上一首|切上一首|回到上一首|返回上一首/],
    toolName: 'prev_track',
    buildArgs: () => ({}),
  },
  {
    id: 'like',
    label: '收藏歌曲',
    patterns: [/收藏(这首)?|喜欢这首|给这首点赞/],
    toolName: 'like_track',
    buildArgs: () => ({ liked: true }),
  },

  // ── 音量（精确优先，避免数字被大/小匹配） ──────────────────────────────
  {
    id: 'vol_exact',
    label: '音量设为',
    patterns: [/(音量|声音).*?(\d+)/],
    toolName: 'set_volume',
    buildArgs: (match) => ({ level: Math.max(0, Math.min(100, Number(match[2]))) }),
  },
  {
    id: 'vol_up',
    label: '音量调大',
    patterns: [/(音量|声音).*(大|高|响)/],
    toolName: 'set_volume',
    buildArgs: (_, state) => ({ level: Math.min(100, state.media.volume + 15) }),
  },
  {
    id: 'vol_down',
    label: '音量调小',
    patterns: [/(音量|声音).*(小|低|轻)/],
    toolName: 'set_volume',
    buildArgs: (_, state) => ({ level: Math.max(0, state.media.volume - 15) }),
  },

  // ── 循环模式 ──────────────────────────────────────────────────────────────
  {
    id: 'repeat_shuffle',
    label: '随机播放',
    patterns: [/随机播放|随机模式|开启随机|切随机/],
    toolName: 'set_repeat_mode',
    buildArgs: () => ({ mode: 'shuffle' }),
  },
  {
    id: 'repeat_single',
    label: '单曲循环',
    patterns: [/单曲循环|单曲播放/],
    toolName: 'set_repeat_mode',
    buildArgs: () => ({ mode: 'single' }),
  },
  {
    id: 'repeat_seq',
    label: '顺序播放',
    patterns: [/顺序播放|列表循环|顺序循环/],
    toolName: 'set_repeat_mode',
    buildArgs: () => ({ mode: 'sequence' }),
  },

  // ── 温度（精确优先） ──────────────────────────────────────────────────────
  {
    id: 'temp_exact',
    label: '温度设为',
    patterns: [/温度.*?(\d+\.?\d*)\s*度/, /[调设]到?\s*(\d+\.?\d*)\s*度/],
    toolName: 'set_temperature',
    buildArgs: (match, _, zone) => ({ zone: toFR(zone), value: Number(match[1]) }),
  },
  {
    id: 'temp_up',
    label: '升温',
    patterns: [/(暖|热)(一点|一些|点)/],
    toolName: 'set_temperature',
    buildArgs: (_, state, zone) => ({
      zone: toFR(zone),
      value: (zone === 'passenger' ? state.climate.tempRear : state.climate.tempFront) + 1,
    }),
  },
  {
    id: 'temp_down',
    label: '降温',
    patterns: [/(凉|冷)(一点|一些|点)/],
    toolName: 'set_temperature',
    buildArgs: (_, state, zone) => ({
      zone: toFR(zone),
      value: (zone === 'passenger' ? state.climate.tempRear : state.climate.tempFront) - 1,
    }),
  },

  // ── 风量 ──────────────────────────────────────────────────────────────────
  {
    id: 'fan_exact',
    label: '风量设为',
    patterns: [/风量.*?(\d)\s*[档级]/],
    toolName: 'set_fan_speed',
    buildArgs: (match, _, zone) => ({ zone: toFR(zone), level: Number(match[1]) }),
  },
  {
    id: 'fan_up',
    label: '风量调大',
    patterns: [/风量.*(大|高|强)|加大风量|风量加大/],
    toolName: 'set_fan_speed',
    buildArgs: (_, state, zone) => ({
      zone: toFR(zone),
      level: Math.min(5, (zone === 'passenger' ? state.climate.fanSpeedRear : state.climate.fanSpeed) + 1),
    }),
  },
  {
    id: 'fan_down',
    label: '风量调小',
    patterns: [/风量.*(小|低|弱)|减小风量|风量减小/],
    toolName: 'set_fan_speed',
    buildArgs: (_, state, zone) => ({
      zone: toFR(zone),
      level: Math.max(1, (zone === 'passenger' ? state.climate.fanSpeedRear : state.climate.fanSpeed) - 1),
    }),
  },

  // ── 空调开关（自动模式比普通开更具体，放前面） ───────────────────────────
  {
    id: 'ac_auto',
    label: '空调自动',
    patterns: [/自动空调|空调自动|全自动模式|开自动/],
    toolName: 'set_climate_auto',
    buildArgs: () => ({ on: true }),
  },
  {
    id: 'ac_on',
    label: '开空调',
    patterns: [/开空调|打开空调|启动空调|空调开/],
    toolName: 'set_ac',
    buildArgs: (_, __, zone) => ({ zone: toFR(zone), on: true }),
  },
  {
    id: 'ac_off',
    label: '关空调',
    patterns: [/关空调|关闭空调|停止空调|空调关/],
    toolName: 'set_ac',
    buildArgs: (_, __, zone) => ({ zone: toFR(zone), on: false }),
  },

  // ── 空气循环 ──────────────────────────────────────────────────────────────
  {
    id: 'circ_fresh',
    label: '切换外循环',
    patterns: [/外循环|新风模式|新风|开外循环|切外循环/],
    toolName: 'set_air_circulation',
    buildArgs: () => ({ mode: 'fresh' }),
  },
  {
    id: 'circ_recirc',
    label: '切换内循环',
    patterns: [/内循环|关外循环|开内循环|切内循环/],
    toolName: 'set_air_circulation',
    buildArgs: () => ({ mode: 'recirculate' }),
  },

  // ── 除霜 ──────────────────────────────────────────────────────────────────
  {
    id: 'defrost_on',
    label: '开前挡除霜',
    patterns: [/开.?除霜|除霜开|开启除霜/],
    toolName: 'set_defrost',
    buildArgs: () => ({ on: true }),
  },
  {
    id: 'defrost_off',
    label: '关前挡除霜',
    patterns: [/关.?除霜|除霜关|关闭除霜/],
    toolName: 'set_defrost',
    buildArgs: () => ({ on: false }),
  },

  // ── 出风口模式 ────────────────────────────────────────────────────────────
  {
    id: 'airflow_face',
    label: '出风口吹脸',
    patterns: [/吹脸|面部出风|吹面部/],
    toolName: 'set_airflow_mode',
    buildArgs: (_, __, zone) => ({ zone: toFR(zone), mode: 'face' }),
  },
  {
    id: 'airflow_feet',
    label: '出风口吹脚',
    patterns: [/吹脚|脚部出风|吹腿/],
    toolName: 'set_airflow_mode',
    buildArgs: (_, __, zone) => ({ zone: toFR(zone), mode: 'feet' }),
  },
  {
    id: 'airflow_diffuse',
    label: '避免直吹',
    patterns: [/避免直吹|扩散出风|不要直吹/],
    toolName: 'set_airflow_mode',
    buildArgs: (_, __, zone) => ({ zone: toFR(zone), mode: 'diffuse' }),
  },

  // ── 空气净化 ──────────────────────────────────────────────────────────────
  {
    id: 'purifier_on',
    label: '开空气净化',
    patterns: [/开.?净化|净化开|空气净化|开启净化/],
    toolName: 'set_air_purifier',
    buildArgs: () => ({ level: 'high' }),
  },
  {
    id: 'purifier_off',
    label: '关空气净化',
    patterns: [/关.?净化|净化关|关闭净化/],
    toolName: 'set_air_purifier',
    buildArgs: () => ({ level: 'off' }),
  },

  // ── 香氛 ──────────────────────────────────────────────────────────────────
  {
    id: 'fragrance_forest',
    label: '森林香氛',
    patterns: [/森林香|切森林|换成森林|香氛.?森林/],
    toolName: 'set_fragrance',
    buildArgs: () => ({ type: 'forest' }),
  },
  {
    id: 'fragrance_ocean',
    label: '海洋香氛',
    patterns: [/海洋香|切海洋|换成海洋|香氛.?海洋/],
    toolName: 'set_fragrance',
    buildArgs: () => ({ type: 'ocean' }),
  },
  {
    id: 'fragrance_floral',
    label: '花香香氛',
    patterns: [/花香|切花香|换成花香|香氛.?花香/],
    toolName: 'set_fragrance',
    buildArgs: () => ({ type: 'floral' }),
  },
  {
    id: 'fragrance_off',
    label: '关香氛',
    patterns: [/关香氛|不要香味|无香|关.?香氛/],
    toolName: 'set_fragrance',
    buildArgs: () => ({ type: 'none' }),
  },

  // ── 方向盘加热 ────────────────────────────────────────────────────────────
  {
    id: 'steer_heat_on',
    label: '方向盘加热',
    patterns: [/方向盘.*(加热|热起来)|开.?方向盘加热/],
    toolName: 'set_steering_heat',
    buildArgs: () => ({ on: true }),
  },
  {
    id: 'steer_heat_off',
    label: '关方向盘加热',
    patterns: [/关.?方向盘|方向盘.*(关|停止)/],
    toolName: 'set_steering_heat',
    buildArgs: () => ({ on: false }),
  },

  // ── 温度同步 ──────────────────────────────────────────────────────────────
  {
    id: 'temp_sync_on',
    label: '温度同步',
    patterns: [/温度同步|前后同步|同步温度/],
    toolName: 'set_temp_sync',
    buildArgs: () => ({ on: true }),
  },
  {
    id: 'temp_sync_off',
    label: '关温度同步',
    patterns: [/关温度同步|取消同步|独立调温/],
    toolName: 'set_temp_sync',
    buildArgs: () => ({ on: false }),
  },

  // ── 氛围灯 ────────────────────────────────────────────────────────────────
  {
    id: 'ambient_on',
    label: '开氛围灯',
    patterns: [/开.?氛围灯|氛围灯开|打开氛围灯/],
    toolName: 'set_ambient_light',
    buildArgs: () => ({ on: true }),
  },
  {
    id: 'ambient_off',
    label: '关氛围灯',
    patterns: [/关.?氛围灯|氛围灯关|关闭氛围灯/],
    toolName: 'set_ambient_light',
    buildArgs: () => ({ on: false }),
  },
  {
    id: 'ambient_bright',
    label: '氛围灯调亮',
    patterns: [/氛围灯.*(亮|调亮)|亮.?氛围灯/],
    toolName: 'set_ambient_light',
    buildArgs: (_, state) => ({ brightness: Math.min(100, state.ambientLight.brightness + 20) }),
  },
  {
    id: 'ambient_dim',
    label: '氛围灯调暗',
    patterns: [/氛围灯.*(暗|调暗|弱)|暗.?氛围灯/],
    toolName: 'set_ambient_light',
    buildArgs: (_, state) => ({ brightness: Math.max(10, state.ambientLight.brightness - 20) }),
  },

  // ── 车窗（全部关闭优先于单窗） ────────────────────────────────────────────
  {
    id: 'win_all_close',
    label: '关所有车窗',
    patterns: [/关所有窗|所有.?窗.?关|全部车窗关|一键关窗|全关车窗/],
    toolName: 'set_all_windows',
    buildArgs: () => ({ value: 0 }),
  },
  {
    id: 'win_close',
    label: '关车窗',
    patterns: [/(车窗|窗).*(关|收起)|关.?(车)?窗/],
    toolName: 'set_window',
    buildArgs: (_, __, zone) => ({ position: toDP(zone), value: 0 }),
  },
  {
    id: 'win_open',
    label: '开车窗',
    patterns: [/(车窗|窗).*(开|打开|透气|通风)|开.?(车)?窗/],
    toolName: 'set_window',
    buildArgs: (_, __, zone) => ({ position: toDP(zone), value: 50 }),
  },

  // ── 天窗 ──────────────────────────────────────────────────────────────────
  {
    id: 'sunroof_open',
    label: '打开天窗',
    patterns: [/天窗.*(开|打开|透气)|打开天窗/],
    toolName: 'set_sunroof',
    buildArgs: () => ({ mode: 'open' }),
  },
  {
    id: 'sunroof_shade',
    label: '天窗遮阳',
    patterns: [/天窗.*(关|遮阳)|关天窗/],
    toolName: 'set_sunroof',
    buildArgs: () => ({ mode: 'shade' }),
  },

  // ── 零重力 ────────────────────────────────────────────────────────────────
  {
    id: 'zero_g_on',
    label: '开零重力',
    patterns: [/零重力模式|开.?零重力|进入零重力/],
    toolName: 'set_zero_gravity',
    buildArgs: (_, __, zone) => ({ zone: toDP(zone), on: true }),
  },
  {
    id: 'zero_g_off',
    label: '关零重力',
    patterns: [/退出零重力|关.?零重力|取消零重力/],
    toolName: 'set_zero_gravity',
    buildArgs: (_, __, zone) => ({ zone: toDP(zone), on: false }),
  },

  // ── 座椅按摩 ──────────────────────────────────────────────────────────────
  {
    id: 'massage_on',
    label: '开座椅按摩',
    patterns: [/开.?按摩|座椅.?按摩|按摩.?开/],
    toolName: 'adjust_seat',
    buildArgs: (_, __, zone) => ({ zone: toDP(zone), massage: true }),
  },
  {
    id: 'massage_off',
    label: '关座椅按摩',
    patterns: [/关.?按摩|停.?按摩|按摩.?关/],
    toolName: 'adjust_seat',
    buildArgs: (_, __, zone) => ({ zone: toDP(zone), massage: false }),
  },

  // ── 座椅加热 ──────────────────────────────────────────────────────────────
  {
    id: 'seat_heat_on',
    label: '座椅加热',
    patterns: [/座椅.?加热|坐垫.?加热|开.?坐垫热|座椅.?热/],
    toolName: 'adjust_seat',
    buildArgs: (_, __, zone) => ({ zone: toDP(zone), heating: true }),
  },
  {
    id: 'seat_heat_off',
    label: '关座椅加热',
    patterns: [/关.?座椅加热|座椅加热.?关|关.?坐垫加热/],
    toolName: 'adjust_seat',
    buildArgs: (_, __, zone) => ({ zone: toDP(zone), heating: false }),
  },

  // ── 座椅通风 ──────────────────────────────────────────────────────────────
  {
    id: 'seat_vent_on',
    label: '座椅通风',
    patterns: [/座椅.?通风|开.?座椅通风/],
    toolName: 'set_seat_ventilation',
    buildArgs: (_, __, zone) => ({ zone: toDP(zone), level: 'medium' }),
  },
  {
    id: 'seat_vent_off',
    label: '关座椅通风',
    patterns: [/关.?座椅通风|座椅通风.?关/],
    toolName: 'set_seat_ventilation',
    buildArgs: (_, __, zone) => ({ zone: toDP(zone), level: 'off' }),
  },
];
