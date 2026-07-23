# 智能座舱 Agent 评价体系

## 1. 评估目标

量化衡量座舱 Agent 的端到端能力，覆盖**路由判断、工具调用、响应速度、推理质量**四个维度，支持在 demo 演示中实时运行并输出评分。

---

## 2. 评估维度

| 维度 | 权重 | 说明 |
|------|------|------|
| 路由精准度 | 25% | 简单指令走规则引擎（Rule），复杂指令走 Agent，路径判断是否正确 |
| 工具命中率 | 35% | 实际调用的工具是否在预期工具列表中（含其一即通过）|
| 响应延迟达标率 | 25% | Rule 路径 < 300ms，Agent 路径 < 8s |
| 推理链完整率 | 15% | Agent 路径的推理面板是否出现 Intent + Decide 阶段 |

**综合得分** = 各维度加权平均，0~100 分制。

---

## 3. 测试用例（共 20 条）

### Rule 路径（10 条）— 确定性，毫秒级响应

| ID | 指令 | 预期工具 | 验证要点 |
|----|------|---------|---------|
| R01 | 暂停 | `pause_music` | route = rule |
| R02 | 下一首 | `next_track` | route = rule |
| R03 | 上一首 | `prev_track` | route = rule |
| R04 | 音量大一点 | `set_volume` | args.value > 当前值 |
| R05 | 音量调到60 | `set_volume` | args.value = 60 |
| R06 | 收藏这首 | `like_track` | route = rule |
| R07 | 温度调到24度 | `set_temperature` | args.value = 24 |
| R08 | 暖一点 | `set_temperature` | args.value = curTemp + 1 |
| R09 | 关窗 | `set_window` | args.value = 0 |
| R10 | 开车窗透气 | `set_window` | args.value = 50 |

### Agent 路径（10 条）— 调用 LLM，测试推理能力

| ID | 指令 | 预期工具（含其一即通过）| 测试重点 |
|----|------|------------|---------|
| A01 | 帮我营造休息的氛围 | `set_temperature`, `set_ambient_light` | 多工具组合 |
| A02 | 我想听爵士乐 | `play_music` | 单工具 Agent 路径 |
| A03 | 副驾太热了帮她调一下 | `set_temperature` | zone:rear 音区路由 |
| A04 | 把全部车窗关上 | `set_all_windows` | 参数合并工具 |
| A05 | 打开空气净化 | `set_air_purifier` | 单工具 |
| A06 | 现在天气怎么样 | `get_weather` | 查询类，有 Result 步骤 |
| A07 | 开个夜驾模式 | `set_ambient_light`, `set_temperature` | 场景理解 + 多工具 |
| A08 | 帮我找个能充电的停车场 | `find_poi` | POI 查询 |
| A09 | 座椅调整一下方便我休息 | `set_zero_gravity`, `adjust_seat` | 意图到工具的映射 |
| A10 | 提醒我半小时后休息 | `set_reminder` | 时间处理 |

---

## 4. 评分计算

```
routing_score  = 路由正确条数 / 总条数 × 100
tool_score     = 工具命中条数 / 总条数 × 100
latency_score  = 延迟达标条数 / 总条数 × 100
chain_score    = 推理链完整条数 / Agent 条数 × 100

overall = routing_score × 0.25
        + tool_score    × 0.35
        + latency_score × 0.25
        + chain_score   × 0.15
```

---

## 5. 技术实现规划

### 架构

```
用户触发评估
  → GET /eval/run（SSE 流）
    → 逐条调用 POST /chat（本地 HTTP，全链路测试）
      → 解析 SSE 事件：首步类型判路由 / 收集 tool_call / 计时
    → 实时推送 progress 事件到前端
      → 前端列表实时更新
    → 全部完成后推送 summary
      → 前端展示综合评分
```

全链路通过 HTTP 调用 `/chat` 测试，与真实用户行为完全一致。

### 新增文件

| 文件 | 作用 |
|------|------|
| `backend/eval/cases.ts` | 20 条测试用例定义 |
| `backend/eval/runner.ts` | 单条用例执行逻辑（调用 /chat、解析 SSE、输出结果）|
| `backend/routes/eval.ts` | GET /eval/run SSE 端点 |
| `frontend/src/components/EvalOverlay.tsx` | 全屏覆盖层，实时展示进度与评分 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `backend/server.ts` | 注册 eval 路由 |
| `frontend/src/App.tsx` | Header 加「评估」按钮 + 覆盖层状态控制 |

---

## 6. 用例结果数据结构

```typescript
interface EvalCase {
  id: string;
  category: 'rule' | 'agent';
  input: string;
  zone?: 'driver' | 'passenger';
  expectedRoute: 'rule' | 'agent';
  expectedTools: string[];
  latencyThresholdMs: number;  // rule: 300, agent: 8000
}

interface EvalResult {
  caseId: string;
  passed: boolean;
  routeMatch: boolean;
  toolMatch: boolean;
  latencyOk: boolean;
  chainComplete: boolean;
  actualRoute: 'rule' | 'agent';
  toolsCalled: string[];
  latencyMs: number;
  error?: string;
}

interface EvalSummary {
  total: number;
  passed: number;
  scores: {
    routing: number;
    tool: number;
    latency: number;
    chain: number;
    overall: number;
  };
}
```

---

## 7. 预期基准

| 维度 | 目标 |
|------|------|
| Rule 路径路由精准度 | 100%（确定性规则）|
| Agent 路径工具命中率 | ≥ 80%（LLM 非确定性，允许一定波动）|
| Rule 延迟达标率 | 100%（< 300ms）|
| Agent 延迟达标率 | ≥ 90%（< 8s，偶发超时可接受）|
| 推理链完整率 | ≥ 85%（intent + decide 基本稳定）|
| **综合得分** | **目标 ≥ 85 分** |
