import type { EvalCase } from './types.ts';

export const EVAL_CASES: EvalCase[] = [

  // ── 音乐控制 · Rule ×6 ────────────────────────────────────────
  {
    id: 'R01', name: '暂停音乐', category: 'music', route: 'rule',
    input: '暂停', requiredTools: ['pause_music'], latencyMs: 300,
  },
  {
    id: 'R02', name: '下一首', category: 'music', route: 'rule',
    input: '下一首', requiredTools: ['next_track'], latencyMs: 300,
  },
  {
    id: 'R03', name: '上一首', category: 'music', route: 'rule',
    input: '上一首', requiredTools: ['prev_track'], latencyMs: 300,
  },
  {
    id: 'R04', name: '收藏当前歌曲', category: 'music', route: 'rule',
    input: '收藏这首', requiredTools: ['like_track'], latencyMs: 300,
  },
  {
    id: 'R05', name: '音量调大', category: 'music', route: 'rule',
    input: '音量大一点', requiredTools: ['set_volume'], latencyMs: 300,
    keyArgs: (s) => ({ value: Math.min(100, s.media.volume + 15) }),
    note: '验证音量增量是否正确',
  },
  {
    id: 'R06', name: '音量精确设置', category: 'music', route: 'rule',
    input: '音量调到60', requiredTools: ['set_volume'], latencyMs: 300,
    keyArgs: () => ({ value: 60 }),
  },

  // ── 音乐控制 · Agent ×4 ──────────────────────────────────────
  {
    id: 'A01', name: '播放指定风格', category: 'music', route: 'agent',
    input: '我想听爵士乐', requiredTools: ['play_music'], latencyMs: 8000,
  },
  {
    id: 'A02', name: '模糊风格请求', category: 'music', route: 'agent',
    input: '换个轻松的音乐', requiredTools: ['play_music'], latencyMs: 8000,
    note: '模糊指令：风格需 Agent 推断',
  },
  {
    id: 'A03', name: '模糊音量偏大', category: 'music', route: 'agent',
    input: '声音有点大', requiredTools: ['set_volume'], latencyMs: 8000,
    note: '模糊指令：无具体数值，需 Agent 判断降低多少',
  },
  {
    id: 'A04', name: '适合开车的歌', category: 'music', route: 'agent',
    input: '来首适合开车的歌', requiredTools: ['play_music'], latencyMs: 8000,
    note: '场景化模糊请求',
  },

  // ── 温度/空调 · Rule ×4 ──────────────────────────────────────
  {
    id: 'R07', name: '温度精确设置', category: 'climate', route: 'rule',
    input: '温度调到24度', requiredTools: ['set_temperature'], latencyMs: 300,
    keyArgs: () => ({ value: 24 }),
  },
  {
    id: 'R08', name: '暖一点', category: 'climate', route: 'rule',
    input: '暖一点', requiredTools: ['set_temperature'], latencyMs: 300,
    keyArgs: (s) => ({ value: s.climate.tempFront + 1 }),
    note: '动态参数：当前温度 +1',
  },
  {
    id: 'R09', name: '凉一点', category: 'climate', route: 'rule',
    input: '凉一点', requiredTools: ['set_temperature'], latencyMs: 300,
    keyArgs: (s) => ({ value: s.climate.tempFront - 1 }),
  },
  {
    id: 'R10', name: '温度调低到20', category: 'climate', route: 'rule',
    input: '温度调到20度', requiredTools: ['set_temperature'], latencyMs: 300,
    keyArgs: () => ({ value: 20 }),
  },

  // ── 温度/空调 · Agent ×8 ─────────────────────────────────────
  {
    id: 'A05', name: '模糊偏热', category: 'climate', route: 'agent',
    input: '有点热', requiredTools: ['set_temperature'], latencyMs: 8000,
    note: '模糊指令：热→降温，但没说降多少',
  },
  {
    id: 'A06', name: '模糊偏冷', category: 'climate', route: 'agent',
    input: '有点冷', requiredTools: ['set_temperature'], latencyMs: 8000,
    note: '模糊指令：冷→升温',
  },
  {
    id: 'A07', name: '打开前排空调', category: 'climate', route: 'agent',
    input: '打开前排空调', requiredTools: ['set_ac'], latencyMs: 8000,
    keyArgs: () => ({ zone: 'front', on: true }),
  },
  {
    id: 'A08', name: '自动空调', category: 'climate', route: 'agent',
    input: '打开自动空调', requiredTools: ['set_climate_auto'], latencyMs: 8000,
    keyArgs: () => ({ on: true }),
  },
  {
    id: 'A09', name: '内循环', category: 'climate', route: 'agent',
    input: '开内循环', requiredTools: ['set_air_circulation'], latencyMs: 8000,
    keyArgs: () => ({ mode: 'recirculate' }),
  },
  {
    id: 'A10', name: '风向吹脸', category: 'climate', route: 'agent',
    input: '风向换成吹脸', requiredTools: ['set_airflow_mode'], latencyMs: 8000,
    keyArgs: () => ({ mode: 'face' }),
  },
  {
    id: 'A11', name: '开启香氛', category: 'climate', route: 'agent',
    input: '开一下香氛', requiredTools: ['set_fragrance'], latencyMs: 8000,
  },
  {
    id: 'A12', name: '方向盘加热', category: 'climate', route: 'agent',
    input: '开方向盘加热', requiredTools: ['set_steering_heat'], latencyMs: 8000,
    keyArgs: () => ({ on: true }),
  },

  // ── 氛围灯 · Agent ×5 ────────────────────────────────────────
  {
    id: 'A13', name: '开氛围灯', category: 'ambient', route: 'agent',
    input: '开氛围灯', requiredTools: ['set_ambient_light'], latencyMs: 8000,
  },
  {
    id: 'A14', name: '氛围灯颜色', category: 'ambient', route: 'agent',
    input: '氛围灯调成红色', requiredTools: ['set_ambient_light'], latencyMs: 8000,
    note: '验证 Agent 能否推断出正确颜色 hex 值',
  },
  {
    id: 'A15', name: '模糊亮度过高', category: 'ambient', route: 'agent',
    input: '灯光有点刺眼', requiredTools: ['set_ambient_light'], latencyMs: 8000,
    note: '模糊指令：应调低亮度而非关灯',
  },
  {
    id: 'A16', name: '氛围灯动效', category: 'ambient', route: 'agent',
    input: '氛围灯换成呼吸效果', requiredTools: ['set_ambient_light'], latencyMs: 8000,
    keyArgs: () => ({ mode: 'breathe' }),
  },
  {
    id: 'A17', name: '氛围灯调暗', category: 'ambient', route: 'agent',
    input: '把氛围灯调暗一点', requiredTools: ['set_ambient_light'], latencyMs: 8000,
    note: '模糊亮度下调',
  },

  // ── 车窗/天窗 · Rule ×3 ──────────────────────────────────────
  {
    id: 'R11', name: '关窗', category: 'window', route: 'rule',
    input: '关窗', requiredTools: ['set_window'], latencyMs: 300,
    keyArgs: () => ({ value: 0 }),
  },
  {
    id: 'R12', name: '开窗透气', category: 'window', route: 'rule',
    input: '开车窗透气', requiredTools: ['set_window'], latencyMs: 300,
    keyArgs: () => ({ value: 50 }),
  },
  {
    id: 'R13', name: '开窗户', category: 'window', route: 'rule',
    input: '开窗户', requiredTools: ['set_window'], latencyMs: 300,
  },

  // ── 车窗/天窗 · Agent ×2 ─────────────────────────────────────
  {
    id: 'A18', name: '打开天窗', category: 'window', route: 'agent',
    input: '打开天窗', requiredTools: ['set_sunroof'], latencyMs: 8000,
    keyArgs: () => ({ mode: 'open' }),
  },
  {
    id: 'A19', name: '模糊闷热', category: 'window', route: 'agent',
    input: '车里有点闷', requiredTools: ['set_window', 'set_air_circulation'], latencyMs: 8000,
    note: '模糊指令：开窗或切外循环均可接受',
  },

  // ── 座椅 · Agent ×5 ──────────────────────────────────────────
  {
    id: 'A20', name: '模糊座椅调整', category: 'seat', route: 'agent',
    input: '调整一下座椅', requiredTools: ['adjust_seat'], latencyMs: 8000,
    note: '模糊指令：需 Agent 问询或给出默认方案',
  },
  {
    id: 'A21', name: '零重力模式', category: 'seat', route: 'agent',
    input: '开零重力', requiredTools: ['set_zero_gravity'], latencyMs: 8000,
    keyArgs: () => ({ on: true }),
  },
  {
    id: 'A22', name: '座椅加热', category: 'seat', route: 'agent',
    input: '座椅加热开一下', requiredTools: ['adjust_seat'], latencyMs: 8000,
    keyArgs: () => ({ heating: true }),
  },
  {
    id: 'A23', name: '模糊坐姿不适', category: 'seat', route: 'agent',
    input: '坐着有点不舒服', requiredTools: ['adjust_seat', 'set_lumbar'], latencyMs: 8000,
    note: '模糊指令：不适来源不明，Agent 需判断',
  },
  {
    id: 'A24', name: '座椅通风', category: 'seat', route: 'agent',
    input: '开座椅通风', requiredTools: ['set_seat_ventilation'], latencyMs: 8000,
  },

  // ── 副驾/多区域 · Agent ×6 ───────────────────────────────────
  {
    id: 'A25', name: '副驾偏热', category: 'zone', route: 'agent',
    input: '副驾太热了帮她调一下', requiredTools: ['set_temperature'], latencyMs: 8000,
    keyArgs: () => ({ zone: 'rear' }),
    note: '关键：zone 必须为 rear',
  },
  {
    id: 'A26', name: '后排乘客偏冷', category: 'zone', route: 'agent',
    input: '后排乘客说有点冷', requiredTools: ['set_temperature'], latencyMs: 8000,
    keyArgs: () => ({ zone: 'rear' }),
  },
  {
    id: 'A27', name: '副驾零重力', category: 'zone', route: 'agent',
    input: '帮副驾开个零重力', requiredTools: ['set_zero_gravity'], latencyMs: 8000,
    keyArgs: () => ({ zone: 'passenger' }),
  },
  {
    id: 'A28', name: '全区温度统一', category: 'zone', route: 'agent',
    input: '前后温度都调到22度', requiredTools: ['set_temperature'], latencyMs: 8000,
    keyArgs: () => ({ zone: 'all', value: 22 }),
  },
  {
    id: 'A29', name: '全区开空调', category: 'zone', route: 'agent',
    input: '大家都开空调', requiredTools: ['set_ac'], latencyMs: 8000,
    keyArgs: () => ({ zone: 'all', on: true }),
  },
  {
    id: 'A30', name: '副驾反馈灯光', category: 'zone', route: 'agent',
    input: '副驾说灯光太亮了', requiredTools: ['set_ambient_light'], latencyMs: 8000,
    note: '副驾需求但操作对象是全车氛围灯',
  },

  // ── 复合多步场景 · Agent ×14 ─────────────────────────────────
  {
    id: 'A31', name: '睡眠模式', category: 'scene', route: 'agent',
    input: '我要睡觉了', requiredTools: ['set_zero_gravity', 'set_ambient_light', 'pause_music'], latencyMs: 8000,
  },
  {
    id: 'A32', name: '高速行驶准备', category: 'scene', route: 'agent',
    input: '准备上高速', requiredTools: ['set_all_windows', 'set_air_circulation'], latencyMs: 8000,
  },
  {
    id: 'A33', name: '晕车处理', category: 'scene', route: 'agent',
    input: '有点晕车', requiredTools: ['set_window', 'set_air_circulation'], latencyMs: 8000,
  },
  {
    id: 'A34', name: '到达收拾', category: 'scene', route: 'agent',
    input: '快到了帮我收拾一下', requiredTools: ['pause_music', 'set_all_windows'], latencyMs: 8000,
  },
  {
    id: 'A35', name: '夜驾模式', category: 'scene', route: 'agent',
    input: '开个夜驾模式', requiredTools: ['set_ambient_light', 'set_temperature'], latencyMs: 8000,
  },
  {
    id: 'A36', name: '全家出行', category: 'scene', route: 'agent',
    input: '全家出行调一下车内环境', requiredTools: ['set_temperature', 'set_ambient_light'], latencyMs: 8000,
  },
  {
    id: 'A37', name: '商务接待', category: 'scene', route: 'agent',
    input: '商务接待模式', requiredTools: ['set_fragrance', 'set_ambient_light', 'set_temperature'], latencyMs: 8000,
  },
  {
    id: 'A38', name: '副驾睡眠', category: 'scene', route: 'agent',
    input: '副驾想睡觉帮她调好', requiredTools: ['set_zero_gravity', 'set_temperature'], latencyMs: 8000,
    keyArgs: () => ({ zone: 'passenger' }),
  },
  {
    id: 'A39', name: '雨天模式', category: 'scene', route: 'agent',
    input: '开始下雨了', requiredTools: ['set_all_windows', 'set_defrost'], latencyMs: 8000,
  },
  {
    id: 'A40', name: '休息氛围', category: 'scene', route: 'agent',
    input: '帮我营造休息的氛围', requiredTools: ['set_temperature', 'set_ambient_light'], latencyMs: 8000,
  },
  {
    id: 'A41', name: '黄昏调节', category: 'scene', route: 'agent',
    input: '天黑了调一下车内氛围', requiredTools: ['set_ambient_light', 'set_temperature'], latencyMs: 8000,
  },
  {
    id: 'A42', name: '运动感环境', category: 'scene', route: 'agent',
    input: '来个运动感的环境', requiredTools: ['set_ambient_light', 'play_music'], latencyMs: 8000,
  },
  {
    id: 'A43', name: '节能模式', category: 'scene', route: 'agent',
    input: '帮我开节能模式', requiredTools: ['set_climate_auto', 'set_ambient_light'], latencyMs: 8000,
  },
  {
    id: 'A44', name: '保存场景', category: 'scene', route: 'agent',
    input: '把现在的设置存为我的睡眠模式', requiredTools: ['save_scene'], latencyMs: 8000,
  },

  // ── 导航 · Agent ×8 ──────────────────────────────────────────
  {
    id: 'A45', name: '找充电桩', category: 'navigation', route: 'agent',
    input: '找个附近的充电桩', requiredTools: ['find_poi'], latencyMs: 8000,
  },
  {
    id: 'A46', name: '找停车场', category: 'navigation', route: 'agent',
    input: '找个停车场', requiredTools: ['find_poi'], latencyMs: 8000,
  },
  {
    id: 'A47', name: '模糊餐饮查询', category: 'navigation', route: 'agent',
    input: '找个吃饭的地方', requiredTools: ['find_poi'], latencyMs: 8000,
    note: '模糊 query：餐厅类型未指定',
  },
  {
    id: 'A48', name: '导航回家', category: 'navigation', route: 'agent',
    input: '导航回家', requiredTools: ['set_navigation'], latencyMs: 8000,
  },
  {
    id: 'A49', name: '找加油站', category: 'navigation', route: 'agent',
    input: '找最近的加油站', requiredTools: ['find_poi'], latencyMs: 8000,
  },
  {
    id: 'A50', name: '模糊咖啡查询', category: 'navigation', route: 'agent',
    input: '找个能喝咖啡的地方', requiredTools: ['find_poi'], latencyMs: 8000,
    note: '自然语言模糊表述',
  },
  {
    id: 'A51', name: '导航去医院', category: 'navigation', route: 'agent',
    input: '帮我导航去最近的医院', requiredTools: ['find_poi', 'set_navigation'], latencyMs: 8000,
    note: '两步：先找再导航',
  },
  {
    id: 'A52', name: '设置途经点', category: 'navigation', route: 'agent',
    input: '去虹桥机场，途经静安寺', requiredTools: ['set_navigation'], latencyMs: 8000,
    note: '验证 stops 参数是否正确传递',
  },

  // ── 查询类 · Agent ×5 ────────────────────────────────────────
  {
    id: 'A53', name: '查天气', category: 'query', route: 'agent',
    input: '现在天气怎么样', requiredTools: ['get_weather'], latencyMs: 8000,
  },
  {
    id: 'A54', name: '查车内空气', category: 'query', route: 'agent',
    input: '车内空气质量如何', requiredTools: ['get_air_quality'], latencyMs: 8000,
  },
  {
    id: 'A55', name: '查车辆状态', category: 'query', route: 'agent',
    input: '查一下当前车辆状态', requiredTools: ['get_car_state'], latencyMs: 8000,
  },
  {
    id: 'A56', name: '查室内温度', category: 'query', route: 'agent',
    input: '现在车内温度是多少', requiredTools: ['get_car_state'], latencyMs: 8000,
    note: '查询而非控制，不应调用 set_temperature',
  },
  {
    id: 'A57', name: '查室外温度', category: 'query', route: 'agent',
    input: '外面现在多少度', requiredTools: ['get_weather'], latencyMs: 8000,
  },

  // ── 边界/低频 · 混合 ×5 ──────────────────────────────────────
  {
    id: 'R14', name: '暂停变体', category: 'edge', route: 'rule',
    input: '停一下', requiredTools: ['pause_music'], latencyMs: 300,
    note: '规则变体：非标准表达是否命中',
  },
  {
    id: 'R15', name: '切歌变体', category: 'edge', route: 'rule',
    input: '换一首', requiredTools: ['next_track'], latencyMs: 300,
  },
  {
    id: 'A58', name: '设置提醒', category: 'edge', route: 'agent',
    input: '帮我设个10分钟后的提醒', requiredTools: ['set_reminder'], latencyMs: 8000,
  },
  {
    id: 'A59', name: '关前排空调', category: 'edge', route: 'agent',
    input: '把前排空调关了', requiredTools: ['set_ac'], latencyMs: 8000,
    keyArgs: () => ({ zone: 'front', on: false }),
  },
  {
    id: 'A60', name: '温度同步', category: 'edge', route: 'agent',
    input: '让副驾温度跟主驾一样', requiredTools: ['set_temp_sync'], latencyMs: 8000,
    keyArgs: () => ({ on: true }),
  },
];
