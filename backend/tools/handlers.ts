import { vehicleState, patchVehicleState } from '../agent/vehicleState.ts';
import { scenesStorage } from '../storage/scenes.ts';
import type { SceneAction, VehicleState } from '../../shared/types.ts';

export interface ToolResult {
  success: boolean;
  data?: unknown;
  vehiclePatch?: Partial<VehicleState>;
  message?: string;
}

const MOCK_TRACKS: Record<string, { trackName: string; artist: string }[]> = {
  jazz:       [{ trackName: 'Take Five', artist: 'Dave Brubeck' }, { trackName: 'So What', artist: 'Miles Davis' }, { trackName: 'Autumn Leaves', artist: 'Bill Evans' }],
  pop:        [{ trackName: 'Blinding Lights', artist: 'The Weeknd' }, { trackName: 'Shape of You', artist: 'Ed Sheeran' }, { trackName: '告白气球', artist: '周杰伦' }],
  classical:  [{ trackName: '月光奏鸣曲', artist: 'Beethoven' }, { trackName: '四季·春', artist: 'Vivaldi' }, { trackName: '卡农', artist: 'Pachelbel' }],
  electronic: [{ trackName: 'Strobe', artist: 'deadmau5' }, { trackName: 'Levels', artist: 'Avicii' }, { trackName: 'One More Time', artist: 'Daft Punk' }],
  folk:       [{ trackName: '南山南', artist: '马頔' }, { trackName: '成都', artist: '赵雷' }, { trackName: '董小姐', artist: '宋冬野' }],
  rock:       [{ trackName: 'Bohemian Rhapsody', artist: 'Queen' }, { trackName: 'Hotel California', artist: 'Eagles' }, { trackName: 'Stairway to Heaven', artist: 'Led Zeppelin' }],
};

const POI_MOCK: Record<string, unknown>[] = [
  { name: '特斯拉超充站（漕宝路）', type: 'charging', distance: 2.3, waitTime: 5, nearRestaurant: true, cuisine: null },
  { name: '星巴克（徐家汇店，含 2 充电桩）', type: 'charging+cafe', distance: 1.8, waitTime: 0, nearRestaurant: false, cuisine: 'cafe' },
  { name: '蜀大侠火锅（天钥桥路店）', type: 'restaurant', cuisine: 'spicy', distance: 0.5, waitTime: 15, charging: false },
  { name: 'SP Charge 超充（漕河泾）', type: 'charging', distance: 3.1, waitTime: 0, nearRestaurant: false, cuisine: null },
  { name: '小南国上海菜（近 SP 超充）', type: 'restaurant', cuisine: 'shanghainese', distance: 2.1, waitTime: 10, charging: true },
];

const savedSeatPositions: {
  driver:    { foreAft: number; recline: number } | null;
  passenger: { foreAft: number; recline: number } | null;
} = { driver: null, passenger: null };

export async function handleTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  switch (toolName) {
    case 'get_car_state':
      return { success: true, data: vehicleState };

    case 'set_temperature': {
      const zone = args.zone as 'front' | 'rear' | 'all';
      const temp = Math.max(16, Math.min(30, Number(args.value)));
      const climate = { ...vehicleState.climate };
      if (zone === 'front' || zone === 'all') climate.tempFront = temp;
      if (zone === 'rear'  || zone === 'all') climate.tempRear  = temp;
      patchVehicleState({ climate });
      return { success: true, message: `温度已调至 ${temp}°C（${zone}）`, vehiclePatch: { climate } };
    }

    case 'set_fan_speed': {
      const zone  = (args.zone as 'front' | 'rear') ?? 'front';
      const level = Math.max(1, Math.min(5, Number(args.level)));
      const climate = { ...vehicleState.climate };
      if (zone === 'front') climate.fanSpeed    = level;
      else                  climate.fanSpeedRear = level;
      patchVehicleState({ climate });
      const zoneLabel = zone === 'front' ? '主驾' : '副驾';
      return { success: true, message: `${zoneLabel}风量已调至 ${level} 档`, vehiclePatch: { climate } };
    }

    case 'set_ambient_light': {
      const turnOn = args.on !== undefined ? Boolean(args.on) : true;
      const light = {
        ...vehicleState.ambientLight,
        on: turnOn,
        ...(args.color      !== undefined ? { color:      String(args.color) } : {}),
        ...(args.brightness !== undefined ? { brightness: Number(args.brightness) } : {}),
        ...(args.mode       !== undefined ? { mode: args.mode as 'static' | 'breathe' | 'flow' } : {}),
      };
      patchVehicleState({ ambientLight: light });
      return { success: true, message: turnOn ? '氛围灯已更新' : '氛围灯已关闭', vehiclePatch: { ambientLight: light } };
    }

    case 'play_music': {
      const query       = String(args.query ?? '').toLowerCase();
      const artistQuery = args.artist ? String(args.artist).toLowerCase() : null;

      if (artistQuery) {
        for (const [g, tracks] of Object.entries(MOCK_TRACKS)) {
          const match = tracks.find(t => t.artist.toLowerCase().includes(artistQuery));
          if (match) {
            const media = { ...vehicleState.media, playing: true, genre: g, trackName: match.trackName, artist: match.artist };
            patchVehicleState({ media });
            return { success: true, message: `正在播放 ${match.trackName} — ${match.artist}`, vehiclePatch: { media } };
          }
        }
      }

      const GENRE_KEYS = ['jazz', 'pop', 'classical', 'electronic', 'folk', 'rock'];
      const GENRE_MAP: Record<string, string> = {
        '爵士': 'jazz', '流行': 'pop', '古典': 'classical',
        '电子': 'electronic', '民谣': 'folk', '摇滚': 'rock',
      };
      let genre = GENRE_KEYS.find(g => query.includes(g)) ?? null;
      if (!genre) {
        for (const [cn, en] of Object.entries(GENRE_MAP)) {
          if (query.includes(cn)) { genre = en; break; }
        }
      }
      genre = genre ?? 'pop';
      const tracks = MOCK_TRACKS[genre] ?? MOCK_TRACKS['pop'];
      const track  = tracks[Math.floor(Math.random() * tracks.length)];
      const media  = { ...vehicleState.media, playing: true, genre, trackName: track.trackName, artist: track.artist };
      patchVehicleState({ media });
      const note = artistQuery ? `（曲库中暂无该歌手，为您播放${genre}类推荐）` : '';
      return { success: true, message: `正在播放 ${track.trackName} — ${track.artist}${note}`, vehiclePatch: { media } };
    }

    case 'set_volume': {
      const level = Math.max(0, Math.min(100, Number(args.level)));
      const media = { ...vehicleState.media, volume: level };
      patchVehicleState({ media });
      return { success: true, message: `音量已调至 ${level}`, vehiclePatch: { media } };
    }

    case 'adjust_seat': {
      const zone = (args.zone as 'driver' | 'passenger') ?? 'driver';
      const positionChanged = args.foreAft !== undefined || args.recline !== undefined;
      if (zone === 'driver') {
        const seat = {
          ...vehicleState.seat,
          ...(positionChanged ? { zeroGravity: false } : {}),
          ...(args.foreAft !== undefined ? { foreAft: Math.max(0, Math.min(100, Number(args.foreAft))) } : {}),
          ...(args.recline !== undefined ? { recline: Math.max(90, Math.min(170, Number(args.recline))) } : {}),
          ...(args.massage !== undefined ? { massage: Boolean(args.massage) } : {}),
          ...(args.heating !== undefined ? { heating: Boolean(args.heating) } : {}),
        };
        patchVehicleState({ seat });
        return { success: true, message: '主驾座椅已调整', vehiclePatch: { seat } };
      } else {
        const seatPassenger = {
          ...vehicleState.seatPassenger,
          ...(positionChanged ? { zeroGravity: false } : {}),
          ...(args.foreAft !== undefined ? { foreAft: Math.max(0, Math.min(100, Number(args.foreAft))) } : {}),
          ...(args.recline !== undefined ? { recline: Math.max(90, Math.min(170, Number(args.recline))) } : {}),
          ...(args.massage !== undefined ? { massage: Boolean(args.massage) } : {}),
          ...(args.heating !== undefined ? { heating: Boolean(args.heating) } : {}),
        };
        patchVehicleState({ seatPassenger });
        return { success: true, message: '副驾座椅已调整', vehiclePatch: { seatPassenger } };
      }
    }

    case 'find_poi': {
      const type        = String(args.type ?? '');
      const constraints = (args.constraints ?? {}) as Record<string, unknown>;
      let results       = [...POI_MOCK];

      if (type === 'charging') {
        results = results.filter(p => String(p.type).includes('charging'));
      } else if (type === 'restaurant') {
        results = results.filter(p => String(p.type).includes('restaurant'));
      }
      if (constraints.cuisine) {
        results = results.filter(p =>
          !p.cuisine || p.cuisine === constraints.cuisine || String(p.type).includes('charging')
        );
      }
      if (constraints.maxDistance) {
        results = results.filter(p => Number(p.distance) <= Number(constraints.maxDistance));
      }
      return { success: true, data: results };
    }

    case 'set_navigation': {
      const destination = String(args.destination ?? '');
      const stops       = Array.isArray(args.stops) ? (args.stops as string[]) : [];
      const route       = stops.map(s => ({
        name: s,
        type: s.includes('充电') || s.includes('超充') ? 'charging' : 'restaurant',
      }));
      const eta        = `约 ${Math.floor(Math.random() * 20 + 15)} 分钟`;
      const navigation = { ...vehicleState.navigation, destination, stops, route, eta };
      patchVehicleState({ navigation });
      return { success: true, message: `导航已设置至 ${destination}`, vehiclePatch: { navigation } };
    }

    case 'get_weather':
      return {
        success: true,
        data: {
          location:  String(args.location ?? '上海'),
          temp:      24,
          condition: '多云',
          humidity:  72,
          wind:      '东风 3 级',
        },
      };

    case 'set_reminder': {
      const reminder = {
        id:      Date.now().toString(),
        text:    String(args.text ?? ''),
        trigger: String(args.trigger ?? ''),
      };
      const reminders = [...vehicleState.reminders, reminder];
      patchVehicleState({ reminders });
      return { success: true, message: `提醒已设置：${reminder.text}`, vehiclePatch: { reminders } };
    }

    case 'save_scene': {
      const scene = {
        id:            Date.now().toString(),
        name:          String(args.name ?? ''),
        triggerPhrase: String(args.triggerPhrase ?? ''),
        source:        'user_defined' as const,
        actions:       (args.actions ?? []) as SceneAction[],
        createdAt:     new Date().toISOString(),
      };
      scenesStorage.save(scene);
      return { success: true, message: `场景「${scene.name}」已保存`, data: scene };
    }

    case 'apply_scene': {
      const name  = String(args.name ?? '');
      const scene = scenesStorage.findByName(name);
      if (!scene) return { success: false, message: `未找到场景「${name}」` };
      const patches: Partial<VehicleState>[] = [];
      for (const action of scene.actions) {
        const result = await handleTool(action.tool, action.args as Record<string, unknown>);
        if (result.vehiclePatch) patches.push(result.vehiclePatch);
      }
      const mergedPatch = Object.assign({}, ...patches) as Partial<VehicleState>;
      return { success: true, message: `场景「${name}」已执行`, data: scene, vehiclePatch: mergedPatch };
    }

    case 'list_scenes':
      return { success: true, data: scenesStorage.list() };

    case 'pause_music': {
      const media = { ...vehicleState.media, playing: false };
      patchVehicleState({ media });
      return { success: true, message: '音乐已暂停', vehiclePatch: { media } };
    }

    case 'next_track': {
      const genre  = vehicleState.media.genre ?? 'pop';
      const tracks = MOCK_TRACKS[genre] ?? MOCK_TRACKS['pop'];
      const idx    = tracks.findIndex(t => t.trackName === vehicleState.media.trackName);
      const track  = tracks[(idx + 1) % tracks.length];
      const media  = { ...vehicleState.media, trackName: track.trackName, artist: track.artist, playing: true };
      patchVehicleState({ media });
      return { success: true, message: `已切换到：${track.trackName} — ${track.artist}`, vehiclePatch: { media } };
    }

    case 'prev_track': {
      const genre  = vehicleState.media.genre ?? 'pop';
      const tracks = MOCK_TRACKS[genre] ?? MOCK_TRACKS['pop'];
      const idx    = tracks.findIndex(t => t.trackName === vehicleState.media.trackName);
      const track  = tracks[(idx - 1 + tracks.length) % tracks.length];
      const media  = { ...vehicleState.media, trackName: track.trackName, artist: track.artist, playing: true };
      patchVehicleState({ media });
      return { success: true, message: `已切换到：${track.trackName} — ${track.artist}`, vehiclePatch: { media } };
    }

    case 'set_repeat_mode': {
      const mode  = args.mode as 'sequence' | 'shuffle' | 'single';
      const media = { ...vehicleState.media, repeatMode: mode };
      patchVehicleState({ media });
      const label = { sequence: '列表顺序', shuffle: '随机播放', single: '单曲循环' }[mode];
      return { success: true, message: `循环模式：${label}`, vehiclePatch: { media } };
    }

    case 'like_track': {
      const liked = Boolean(args.liked);
      const media = { ...vehicleState.media, liked };
      patchVehicleState({ media });
      return { success: true, message: liked ? '已收藏当前歌曲' : '已取消收藏', vehiclePatch: { media } };
    }

    case 'set_ac': {
      const zone    = (args.zone as 'front' | 'rear' | 'all') ?? 'all';
      const on      = Boolean(args.on);
      const climate = { ...vehicleState.climate };
      if (zone === 'front' || zone === 'all') climate.acFront = on;
      if (zone === 'rear'  || zone === 'all') climate.acRear  = on;
      patchVehicleState({ climate });
      const zoneLabel = { front: '主驾', rear: '副驾', all: '全部' }[zone];
      return { success: true, message: `${zoneLabel}空调已${on ? '开启' : '关闭'}`, vehiclePatch: { climate } };
    }

    case 'set_air_circulation': {
      const mode    = args.mode as 'fresh' | 'recirculate' | 'auto';
      const climate = { ...vehicleState.climate, airCirculation: mode };
      patchVehicleState({ climate });
      const label = { fresh: '外循环', recirculate: '内循环', auto: '自动' }[mode];
      return { success: true, message: `空气循环已切换为${label}`, vehiclePatch: { climate } };
    }

    case 'set_defrost': {
      const on      = Boolean(args.on);
      const climate = { ...vehicleState.climate, defrostFront: on };
      patchVehicleState({ climate });
      return { success: true, message: `前挡除霜已${on ? '开启' : '关闭'}`, vehiclePatch: { climate } };
    }

    case 'set_airflow_mode': {
      const zone    = (args.zone as 'front' | 'rear') ?? 'front';
      const mode    = args.mode as 'face' | 'feet' | 'diffuse';
      const climate = { ...vehicleState.climate };
      if (zone === 'front') climate.airflowMode    = mode;
      else                  climate.airflowModeRear = mode;
      patchVehicleState({ climate });
      const modeLabel = { face: '吹脸', feet: '吹脚', diffuse: '避免直吹' }[mode];
      const zoneLabel = zone === 'front' ? '主驾' : '副驾';
      return { success: true, message: `${zoneLabel}出风口已切换为${modeLabel}`, vehiclePatch: { climate } };
    }

    case 'set_air_purifier': {
      const level   = args.level as 'off' | 'low' | 'medium' | 'high';
      const climate = { ...vehicleState.climate, airPurifier: level };
      patchVehicleState({ climate });
      const label = { off: '关闭', low: '低档', medium: '中档', high: '高档' }[level];
      return { success: true, message: `空气净化已设为${label}`, vehiclePatch: { climate } };
    }

    case 'set_fragrance': {
      const type    = args.type as 'none' | 'forest' | 'ocean' | 'floral';
      const climate = { ...vehicleState.climate, fragrance: type };
      patchVehicleState({ climate });
      const label = { none: '关闭', forest: '森林', ocean: '海洋', floral: '花香' }[type];
      return { success: true, message: `香氛已切换为${label}`, vehiclePatch: { climate } };
    }

    case 'set_steering_heat': {
      const on      = Boolean(args.on);
      const climate = { ...vehicleState.climate, steeringHeat: on };
      patchVehicleState({ climate });
      return { success: true, message: `方向盘加热已${on ? '开启' : '关闭'}`, vehiclePatch: { climate } };
    }

    case 'set_temp_sync': {
      const on      = Boolean(args.on);
      const climate = { ...vehicleState.climate, tempSync: on };
      if (on) climate.tempRear = climate.tempFront;
      patchVehicleState({ climate });
      return {
        success: true,
        message: `温度同步已${on ? `开启，副驾已同步至 ${climate.tempFront}°C` : '关闭'}`,
        vehiclePatch: { climate },
      };
    }

    case 'set_climate_auto': {
      const on      = Boolean(args.on);
      const climate = {
        ...vehicleState.climate,
        autoMode: on,
        ...(on ? { airCirculation: 'auto' as const, fanSpeed: 3 } : {}),
      };
      patchVehicleState({ climate });
      return { success: true, message: `空调自动模式已${on ? '开启' : '关闭'}`, vehiclePatch: { climate } };
    }

    case 'get_air_quality': {
      const { pm25Outdoor, pm25Indoor, outdoorTemp, windshieldFogged } = vehicleState.context;
      const level =
        pm25Outdoor > 150 ? '重度污染' :
        pm25Outdoor > 100 ? '中度污染' :
        pm25Outdoor > 75  ? '轻度污染' : '良好';
      return {
        success: true,
        data: {
          pm25Outdoor, pm25Indoor, outdoorTemp, windshieldFogged,
          airQualityLevel: level,
          suggestion: pm25Outdoor > 75 ? '建议切换内循环并开启净化' : '空气质量良好，可使用外循环',
        },
      };
    }

    case 'set_window': {
      const pos = args.position as 'driver' | 'passenger' | 'rearLeft' | 'rearRight';
      const val = Math.max(0, Math.min(100, Number(args.value)));
      const keyMap = {
        driver: 'driverWindow', passenger: 'passengerWindow',
        rearLeft: 'rearLeftWindow', rearRight: 'rearRightWindow',
      } as const;
      const windows  = { ...vehicleState.windows, [keyMap[pos]]: val };
      patchVehicleState({ windows });
      const posLabel = { driver: '主驾', passenger: '副驾', rearLeft: '后排左', rearRight: '后排右' }[pos];
      return { success: true, message: `${posLabel}车窗开度已调至 ${val}%`, vehiclePatch: { windows } };
    }

    case 'set_all_windows': {
      const val     = Math.max(0, Math.min(100, Number(args.value)));
      const windows = {
        ...vehicleState.windows,
        driverWindow: val, passengerWindow: val,
        rearLeftWindow: val, rearRightWindow: val,
      };
      patchVehicleState({ windows });
      return { success: true, message: `所有车窗已${val === 0 ? '关闭' : `调至 ${val}%`}`, vehiclePatch: { windows } };
    }

    case 'set_sunroof': {
      const mode    = args.mode as 'open' | 'shade';
      const windows = { ...vehicleState.windows, sunroof: mode };
      patchVehicleState({ windows });
      const label = { open: '已打开透气', shade: '已切换遮阳' }[mode];
      return { success: true, message: `天窗${label}`, vehiclePatch: { windows } };
    }

    case 'set_zero_gravity': {
      const zone = args.zone as 'driver' | 'passenger';
      const on   = Boolean(args.on);
      const zoneLabel = zone === 'driver' ? '主驾' : '副驾';
      if (zone === 'driver') {
        const cur = vehicleState.seat;
        let seat;
        if (on) {
          savedSeatPositions.driver = { foreAft: cur.foreAft, recline: cur.recline };
          seat = { ...cur, zeroGravity: true, foreAft: 100, recline: 170 };
        } else {
          const saved = savedSeatPositions.driver;
          seat = { ...cur, zeroGravity: false, foreAft: saved?.foreAft ?? 50, recline: saved?.recline ?? 110 };
          savedSeatPositions.driver = null;
        }
        patchVehicleState({ seat });
        return { success: true, message: `${zoneLabel}零重力已${on ? '开启' : '关闭'}`, vehiclePatch: { seat } };
      } else {
        const cur = vehicleState.seatPassenger;
        let seatPassenger;
        if (on) {
          savedSeatPositions.passenger = { foreAft: cur.foreAft, recline: cur.recline };
          seatPassenger = { ...cur, zeroGravity: true, foreAft: 100, recline: 170 };
        } else {
          const saved = savedSeatPositions.passenger;
          seatPassenger = { ...cur, zeroGravity: false, foreAft: saved?.foreAft ?? 50, recline: saved?.recline ?? 110 };
          savedSeatPositions.passenger = null;
        }
        patchVehicleState({ seatPassenger });
        return { success: true, message: `${zoneLabel}零重力已${on ? '开启' : '关闭'}`, vehiclePatch: { seatPassenger } };
      }
    }

    case 'set_seat_ventilation': {
      const zone  = (args.zone as 'driver' | 'passenger') ?? 'driver';
      const level = args.level as 'off' | 'low' | 'medium' | 'high';
      const label = { off: '关闭', low: '低档', medium: '中档', high: '高档' }[level];
      const zoneLabel = zone === 'driver' ? '主驾' : '副驾';
      if (zone === 'driver') {
        const seat = { ...vehicleState.seat, ventilation: level };
        patchVehicleState({ seat });
        return { success: true, message: `${zoneLabel}座椅通风已设为${label}`, vehiclePatch: { seat } };
      } else {
        const seatPassenger = { ...vehicleState.seatPassenger, ventilation: level };
        patchVehicleState({ seatPassenger });
        return { success: true, message: `${zoneLabel}座椅通风已设为${label}`, vehiclePatch: { seatPassenger } };
      }
    }

    case 'set_lumbar': {
      const zone  = (args.zone as 'driver' | 'passenger') ?? 'driver';
      const level = Math.max(0, Math.min(5, Math.round(Number(args.level))));
      const zoneLabel = zone === 'driver' ? '主驾' : '副驾';
      if (zone === 'driver') {
        const seat = { ...vehicleState.seat, lumbar: level };
        patchVehicleState({ seat });
        return { success: true, message: `${zoneLabel}腰部支撑已调至 ${level} 档`, vehiclePatch: { seat } };
      } else {
        const seatPassenger = { ...vehicleState.seatPassenger, lumbar: level };
        patchVehicleState({ seatPassenger });
        return { success: true, message: `${zoneLabel}腰部支撑已调至 ${level} 档`, vehiclePatch: { seatPassenger } };
      }
    }

    default:
      return { success: false, message: `未知工具: ${toolName}` };
  }
}
