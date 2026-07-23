# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

这是一个**面试展示用的智能座舱 Agent Demo**：用户用自然语言控制车内环境，Agent 通过多步工具调用完成复杂指令，推理过程实时 SSE 流式展示，纯 Mock 模式无真实车辆连接。

---

## 常用命令

**前端**（在 `frontend/` 目录下执行）：
```bash
npm run dev      # 开发服务器 → http://localhost:5173
npm run lint     # ESLint 检查
npx tsc --noEmit # 类型检查
```

**后端**（在 `backend/` 目录下执行）：
```bash
cp .env.example .env   # 填入 DEEPSEEK_API_KEY
npm install
npm run dev            # Express 服务器 → http://localhost:3001
npx tsc --noEmit       # 类型检查
npm run eval           # 运行 Agent 评估（75 条用例，无需启动服务器）
npm run eval:diff      # 对比最近两次评估结果
```

前后端需同时运行。`.env` 文件在 `backend/.env`，使用 DeepSeek API（`deepseek-chat` 模型）。

---

## 项目结构

```
cockpit-agent-demo/
├── CLAUDE.md           # 本文件
├── docs/
│   └── evaluation.md   # Agent 评价体系设计文档
├── frontend/           # React 19 + Vite + TypeScript + Tailwind v4 + Zustand v5
│   └── src/
│       ├── types.ts              # 所有共享类型（本地副本，见下方说明）
│       ├── store/vehicleStore.ts # 单一 Zustand store，管理所有应用状态
│       ├── components/cockpit/   # 座舱模拟区：CockpitPanel / DriverZone / PassengerZone / PublicZone
│       ├── components/ChatPanel.tsx      # 对话区（双音区输入 + 消息列表）
│       ├── components/ReasoningPanel.tsx # Agent 推理过程面板
│       ├── components/StateDiff.tsx      # 状态变化展示面板
│       └── components/ui/Icon.tsx        # 统一 Icon 组件（lucide-react 封装）
├── backend/            # Node + Express + TypeScript
│   ├── agent/loop.ts         # LLM Agent 循环（DeepSeek，max 8 轮，30s 超时）
│   ├── agent/vehicleState.ts # 内存中车辆状态单例
│   ├── router/rules.ts       # 规则引擎规则表（53 条，覆盖音乐/空调/窗户/座椅等）
│   ├── router/index.ts       # route() 函数：消息 → rule | agent
│   ├── tools/definitions.ts  # 工具 Schema（OpenAI 格式）
│   ├── tools/handlers.ts     # 工具 Mock 实现
│   ├── prompts/system.ts     # System Prompt（核心资产，含推理外显格式指令）
│   ├── storage/scenes.ts     # 场景 JSON 持久化
│   └── routes/chat.ts        # POST /chat → SSE 流（含路由分发逻辑）
└── shared/             # 类型定义的 source of truth（见下方说明）
```

### 共享类型的注意事项

`shared/types.ts` 是类型定义的源头，但 Vite 在开发模式下禁止跨目录导入。**前端必须使用 `frontend/src/types.ts`（本地副本）**。修改类型时需手动同步两个文件。

---

## 技术关键点

### Zustand v5 模式

多属性 selector **必须**用 `useShallow`，否则会触发无限渲染循环：

```ts
import { useShallow } from 'zustand/react/shallow';
const { climate, patchClimate } = useAppStore(useShallow((s) => ({
  climate: s.vehicle.climate,
  patchClimate: s.patchClimate,
})));
```

单值 selector 不需要 `useShallow`：
```ts
const addMessage = useAppStore((s) => s.addMessage);
```

### 异步回调中的 Store 访问

在异步函数（SSE 回调、fetch 等）中访问 store，必须用 `getState()` 而非 hook，避免闭包过期：

```ts
const s = () => useAppStore.getState();
s().updateVehicle(patch); // 每次调用都拿最新状态
```

### Store 结构

`AppStore`（`vehicleStore.ts`）包含：
- `vehicle: VehicleState` — 所有子系统状态（climate / ambientLight / media / seat / navigation / windows / context）
- `sessionBase: VehicleState | null` — 发送消息时快照，StateDiff 用来计算本轮 Agent 变更
- `messages: ChatMessage[]` — 对话历史
- `reasoning: ReasoningStep[]` — Agent 推理轨迹（ReasoningPanel 使用）
- `isAgentThinking: boolean` — 控制输入禁用 + 推理中状态

Patch action（`patchClimate`、`patchAmbientLight` 等）对对应子对象做浅合并。

### SSE 通信格式

后端向前端推送的事件类型：
- `reasoning` — `{ step: ReasoningStep }` — 推理步骤
- `vehicle_patch` — `{ patch: Partial<VehicleState> }` — 车辆状态变更
- `message` — `{ content: string }` — 最终回复文字
- `error` — `{ message: string }` — 错误信息
- `done` — 流结束

`ReasoningStep.type` 完整枚举：

| type | 来源 | 说明 |
|------|------|------|
| `intent` | Agent LLM | 意图理解阶段，由 `<intent>` XML 标签解析 |
| `plan` | Agent LLM | 任务规划阶段，由 `<plan>` XML 标签解析（多步才出现）|
| `decision` | Agent LLM | 方案决策阶段，由 `<decide>` XML 标签解析 |
| `tool_call` | Agent/Rule | 工具调用，含 toolName + toolArgs |
| `tool_result` | Agent | 仅查询类工具（result.data 存在时）才 emit，执行类不 emit |
| `text` | Agent LLM | LLM 输出无 XML 标签时的降级类型 |
| `rule` | Rule 引擎 | 规则引擎直达，含 toolName + toolArgs |

### 路由层（端云协同）

`routes/chat.ts` 在调用 Agent 前先执行 `router/index.ts` 中的 `route()`：
- **命中规则** → 直接执行工具，< 100ms 响应，推理面板显示 `rule` 步骤
- **未命中** → 调用 `runAgentLoop()`，走 LLM 推理

### Agent Loop + 推理外显

- 模型：`deepseek-chat`（通过 OpenAI SDK + DeepSeek baseURL）
- 最大迭代：8 轮 / 超时：30 秒 / 对话历史：滑动窗口最近 20 条
- System Prompt 末尾有【推理外显格式】指令，要求 LLM 在工具调用前输出 `<intent>` `<plan>` `<decide>` XML 标签
- `loop.ts` 中 `parseStages()` 解析这些标签，emit 对应 typed reasoning steps
- 无标签时降级为 `text` 类型（向后兼容）

---

## 当前已实现工具

**基础**：`get_car_state` / `set_temperature` / `set_ambient_light` / `play_music` / `set_volume` / `find_poi` / `set_navigation` / `get_weather` / `set_reminder` / `save_scene` / `apply_scene` / `list_scenes`

**媒体**：`pause_music` / `next_track` / `prev_track` / `set_repeat_mode`（sequence/shuffle/single）/ `like_track`

**空调**：`set_ac`（zone: front/rear/all）/ `set_fan_speed`（zone: front/rear）/ `set_air_circulation` / `set_defrost`（仅前挡）/ `set_airflow_mode`（zone: front/rear，mode: face/feet/diffuse）/ `set_air_purifier` / `set_fragrance` / `set_steering_heat` / `set_temp_sync` / `set_climate_auto` / `get_air_quality`

**窗户/天窗**：`set_window` / `set_all_windows` / `set_sunroof`（mode: open/shade）

**座椅**：`adjust_seat`（zone: driver/passenger）/ `set_zero_gravity`（zone: driver/passenger）/ `set_seat_ventilation`（zone: driver/passenger）/ `set_lumbar`（zone: driver/passenger）

---

## 设计系统（当前）

**Swiss International Design System**，所有 token 定义在 `frontend/src/index.css`。

**色彩 token**：
- `--bg: #FFFFFF` / `--surface: #F2F2F2` — 背景与卡片底色
- `--border: #000000` / `--border-light: rgba(0,0,0,0.10)` — 粗/细边框
- `--accent: #FF3000` — 强调色（激活态、Agent 输出高亮、accent chip）
- `--text / --text-2 / --text-3 / --text-muted` — 文字层级

**字体**：`'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif`（非等宽）

**核心 CSS class**：
- `.swiss-panel` / `.swiss-panel-header` — 四大面板容器（高度 34px，`box-sizing: border-box`）
- `.swiss-card` — 模块卡片（`padding: var(--pad-card)` = `8px 12px`）
- `.swiss-btn.filled` / `.swiss-btn.outline` — 实心/描边按钮
- `.swiss-chip` / `.swiss-chip.active` / `.swiss-chip.accent` — 状态标签
- `.swiss-toggle` — 开关型按钮
- `.swiss-input` — 聊天输入框（textarea，auto-resize）
- `.swiss-label` / `.swiss-label-accent` — 大写小字标签
- `.scan-in` — 0.18s 淡入下移动画（推理步骤出现时使用）
- `.eq-bar` / `.eq-bar.playing` — 音乐 EQ 波形动画

**布局约定**：
- 全部使用内联 `style={{}}`，不用 Tailwind utility 类
- 模块标题灰底条：`background: var(--surface)`，用负 margin（`-8px -12px 6px`）贴顶延伸至卡片边缘
- 窗户+座椅使用 2×2 CSS Grid（`gridTemplateRows: 'auto 1fr'`）保证标题行等高

---

## Phase 进度

| Phase | 内容 | 状态 |
|-------|------|------|
| 0 | HMI UI + Mock 车辆状态 | ✅ 完成 |
| 1 | LLM 后端 + SSE 流式 + Agent 工具调用 | ✅ 完成 |
| 2A | 功能模块扩展（空调/窗口/座椅/驾驶模式） | ✅ 完成 |
| 2B | UI 整体重设计（Swiss 设计语言 + 双音区布局） | ✅ 完成 |
| 2C | 路由层 + 规则引擎（端云协同，Rule ⚡ vs Agent）| ✅ 完成 |
| 2D | Agent 5阶段推理外显（Intent / Plan / Decide / Execute）| ✅ 完成 |
| 3A | Agent 评价体系（75用例 / 6维度评分 / npm run eval）| ✅ 完成 |
| 3B | fuse.js 场景触发词匹配 | ⬜ 未开始 |
| 4 | 打磨（动效 / 异常处理 / 演示验收） | ⬜ 未开始 |

