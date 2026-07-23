import type OpenAI from 'openai';

export const toolDefinitions: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_car_state',
      description: '获取当前车辆所有子系统的状态（温度、音乐、氛围灯、座椅、导航等）。做任何决策前应先调用此工具了解现状。',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_temperature',
      description: '调节车内温度。zone 指定区域（front/rear/all），value 是目标温度（16~30°C）。',
      parameters: {
        type: 'object',
        properties: {
          zone:  { type: 'string', enum: ['front', 'rear', 'all'], description: '调温区域' },
          value: { type: 'number', description: '目标温度（16~30°C）' },
        },
        required: ['zone', 'value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_fan_speed',
      description: '调节空调风量档位（1~5，5 最强）。zone 指定前排或后排。',
      parameters: {
        type: 'object',
        properties: {
          zone:  { type: 'string', enum: ['front', 'rear'], description: '调节区域，front=前排，rear=后排' },
          level: { type: 'number', description: '风量档位 1~5' },
        },
        required: ['zone', 'level'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_ambient_light',
      description: '设置车内氛围灯。可调颜色（十六进制）、亮度（0~100）和模式（static/breathe/flow）。',
      parameters: {
        type: 'object',
        properties: {
          color:      { type: 'string', description: '颜色十六进制，如 #FF6B35' },
          brightness: { type: 'number', description: '亮度 0~100' },
          mode:       { type: 'string', enum: ['static', 'breathe', 'flow'], description: '灯光模式' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'play_music',
      description: '播放音乐。支持中英文曲风（jazz/pop/classical/electronic/folk/rock，或爵士/流行/古典/电子/民谣/摇滚）。',
      parameters: {
        type: 'object',
        properties: {
          query:  { type: 'string', description: '曲风或搜索关键词（支持中英文）' },
          artist: { type: 'string', description: '（可选）歌手/艺术家名称' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_volume',
      description: '调节音量（0~100）。',
      parameters: {
        type: 'object',
        properties: {
          level: { type: 'number', description: '音量 0~100' },
        },
        required: ['level'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'adjust_seat',
      description: '调节座椅：前后位置（foreAft，0=最前 100=最后）、靠背角度（recline，90°直立~170°接近平躺）、按摩、加热。zone 指定主驾或副驾。调节 foreAft/recline 会退出零重力模式。',
      parameters: {
        type: 'object',
        properties: {
          zone:    { type: 'string', enum: ['driver', 'passenger'], description: '调节区域：driver=主驾，passenger=副驾' },
          foreAft: { type: 'number', description: '前后位置 0~100（%）' },
          recline: { type: 'number', description: '靠背角度 90~170（度）' },
          massage: { type: 'boolean' },
          heating: { type: 'boolean' },
        },
        required: ['zone'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_poi',
      description: '搜索周边地点（充电站/餐厅等），支持约束条件过滤。返回候选列表，你需要分析权衡后再做选择。',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', description: '地点类型：charging / restaurant / charging+restaurant' },
          constraints: {
            type: 'object',
            description: '约束条件',
            properties: {
              cuisine:     { type: 'string', description: '菜系，如 spicy/japanese/western' },
              maxDistance: { type: 'number', description: '最远距离（公里）' },
            },
          },
        },
        required: ['type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_navigation',
      description: '设置导航目的地和途经点。',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string', description: '目的地名称或地址' },
          stops:       { type: 'array', items: { type: 'string' }, description: '途经点列表' },
        },
        required: ['destination'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '获取指定地点的天气信息。',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_reminder',
      description: '设置一个提醒事项。',
      parameters: {
        type: 'object',
        properties: {
          text:    { type: 'string', description: '提醒内容' },
          trigger: { type: 'string', description: '触发条件，如"每2小时"或"到达目的地时"' },
        },
        required: ['text', 'trigger'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_scene',
      description: '保存一个自动化场景，供用户以后用触发短语执行。',
      parameters: {
        type: 'object',
        properties: {
          name:          { type: 'string', description: '场景名称' },
          triggerPhrase: { type: 'string', description: '触发短语（用户说这句话时自动执行）' },
          actions: {
            type: 'array',
            description: '动作序列',
            items: {
              type: 'object',
              properties: {
                tool: { type: 'string' },
                args: { type: 'object' },
              },
              required: ['tool', 'args'],
            },
          },
        },
        required: ['name', 'triggerPhrase', 'actions'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'apply_scene',
      description: '执行一个已保存的场景（按名称）。',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '场景名称' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_scenes',
      description: '列出所有已保存的自动化场景。',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },

  // ── 媒体扩展工具 ──────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'pause_music',
      description: '暂停当前播放的音乐。',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'next_track',
      description: '切换到下一首歌曲（同曲风内循环）。',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'prev_track',
      description: '切换到上一首歌曲（同曲风内环形循环）。',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_repeat_mode',
      description: '设置播放循环模式：sequence=列表顺序，shuffle=随机播放，single=单曲循环。',
      parameters: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['sequence', 'shuffle', 'single'] },
        },
        required: ['mode'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'like_track',
      description: '收藏（liked=true）或取消收藏（liked=false）当前播放的歌曲。',
      parameters: {
        type: 'object',
        properties: { liked: { type: 'boolean' } },
        required: ['liked'],
      },
    },
  },

  // ── 空调扩展工具 ──────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'set_ac',
      description: '开启或关闭空调压缩机。zone 指定前排（front）、后排（rear）或全部（all）。',
      parameters: {
        type: 'object',
        properties: {
          zone: { type: 'string', enum: ['front', 'rear', 'all'], description: '调节区域' },
          on:   { type: 'boolean', description: 'true=开启，false=关闭' },
        },
        required: ['zone', 'on'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_air_circulation',
      description: '切换空气循环模式：fresh=外循环（引入新鲜空气），recirculate=内循环（隔绝外部污染），auto=自动。PM2.5高时建议内循环。',
      parameters: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['fresh', 'recirculate', 'auto'], description: '循环模式' },
        },
        required: ['mode'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_defrost',
      description: '控制前挡除霜/除雾。低温或起雾时使用。',
      parameters: {
        type: 'object',
        properties: {
          on: { type: 'boolean' },
        },
        required: ['on'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_airflow_mode',
      description: '设置出风口方向。zone 指定前排或后排，mode：face=吹脸，feet=吹脚，diffuse=避免直吹（漫射模式，适合不想被直吹的乘客）。',
      parameters: {
        type: 'object',
        properties: {
          zone: { type: 'string', enum: ['front', 'rear'], description: '调节区域' },
          mode: { type: 'string', enum: ['face', 'feet', 'diffuse'] },
        },
        required: ['zone', 'mode'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_air_purifier',
      description: '设置车内空气净化等级（off/low/medium/high）。PM2.5高或内循环时建议开启。',
      parameters: {
        type: 'object',
        properties: {
          level: { type: 'string', enum: ['off', 'low', 'medium', 'high'] },
        },
        required: ['level'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_fragrance',
      description: '控制车内香氛系统：none=关闭，forest=森林，ocean=海洋，floral=花香。',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['none', 'forest', 'ocean', 'floral'] },
        },
        required: ['type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_steering_heat',
      description: '开启或关闭方向盘加热。车外温度低时建议开启。',
      parameters: {
        type: 'object',
        properties: { on: { type: 'boolean' } },
        required: ['on'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_temp_sync',
      description: '开启前后排温度同步，后排温度将跟随前排。关闭后可独立调节。',
      parameters: {
        type: 'object',
        properties: { on: { type: 'boolean' } },
        required: ['on'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_climate_auto',
      description: '开启/关闭空调全自动模式。开启后系统自动管理温度、风速和循环模式。',
      parameters: {
        type: 'object',
        properties: { on: { type: 'boolean' } },
        required: ['on'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_air_quality',
      description: '获取当前车内外空气质量数据：PM2.5（室内/室外）、车外温度、前挡是否起雾。做空调决策前可先调用。',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },

  // ── 窗口/天窗工具 ──────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'set_window',
      description: '调节指定车窗开度（0=全关，100=全开）。车速>80km/h时不应开窗。position：driver=驾驶员，passenger=副驾，rearLeft=后排左，rearRight=后排右。',
      parameters: {
        type: 'object',
        properties: {
          position: { type: 'string', enum: ['driver', 'passenger', 'rearLeft', 'rearRight'], description: '车窗位置' },
          value:    { type: 'number', description: '开度 0~100（百分比）' },
        },
        required: ['position', 'value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_all_windows',
      description: '一键升降所有车窗到同一开度（0=全关，100=全开）。',
      parameters: {
        type: 'object',
        properties: {
          value: { type: 'number', description: '开度 0~100' },
        },
        required: ['value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_sunroof',
      description: '控制天窗状态：open=打开透气，shade=遮阳（关闭遮阳帘并关闭天窗）。车速>100km/h时不应开天窗。',
      parameters: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['open', 'shade'], description: '天窗状态' },
        },
        required: ['mode'],
      },
    },
  },

  // ── 座椅扩展工具 ──────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'set_zero_gravity',
      description: '开启/关闭座椅零重力模式。开启时靠背调至170°、位置调至最后（前后100%）；关闭时恢复原来的位置和角度。',
      parameters: {
        type: 'object',
        properties: {
          zone: { type: 'string', enum: ['driver', 'passenger'], description: '调节区域：driver=主驾，passenger=副驾' },
          on:   { type: 'boolean', description: 'true=开启，false=关闭' },
        },
        required: ['zone', 'on'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_seat_ventilation',
      description: '设置座椅通风等级（off/low/medium/high）。zone 指定主驾或副驾。夏天高温时建议开启，与加热互斥。',
      parameters: {
        type: 'object',
        properties: {
          zone:  { type: 'string', enum: ['driver', 'passenger'], description: '调节区域：driver=主驾，passenger=副驾' },
          level: { type: 'string', enum: ['off', 'low', 'medium', 'high'] },
        },
        required: ['zone', 'level'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_lumbar',
      description: '调节座椅腰部支撑强度（0=无，5=最强）。zone 指定主驾或副驾。长途驾驶建议3-4档。',
      parameters: {
        type: 'object',
        properties: {
          zone:  { type: 'string', enum: ['driver', 'passenger'], description: '调节区域：driver=主驾，passenger=副驾' },
          level: { type: 'number', description: '腰托强度 0~5' },
        },
        required: ['zone', 'level'],
      },
    },
  },
];
