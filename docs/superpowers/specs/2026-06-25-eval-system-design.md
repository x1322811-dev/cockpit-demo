# 智能座舱 Agent 评价体系设计文档

**日期**：2026-06-25  
**用途**：开发质量卡口（非 demo 展示）

---

## 1. 目标

建立一套可重复执行的自动化评估流程，量化衡量座舱 Agent 的推理与执行质量。核心价值：

- 每次修改 prompt 或规则后，快速验证有没有效果
- 发现 bad case 后，修复完可以立刻确认是否真正修好
- 防止优化一处、破坏他处（回归退化检测）

---

## 2. 运行方式

```bash
npm run eval         # 跑全部 75 条用例，输出结果 + 存档
npm run eval:diff    # 对比最近两次结果，显示变化
```

不需要启动服务器。脚本直接调用后端函数（`route()` + `runAgentLoop()`），通过 mock emitter 收集事件。

---

## 3. 文件结构

```
backend/eval/
├── types.ts          # EvalCase / EvalResult / EvalSummary 类型
├── cases.ts          # 75 条测试用例
├── runner.ts         # 单条用例执行逻辑
├── run.ts            # 入口脚本：汇总输出 + 存档
└── results/          # JSON 结果文件（时间戳命名，gitignore）
```

---

## 4. 测试用例（75 条）

每条用例结构：

```typescript
interface EvalCase {
  id: string;                    // R01 / A01
  name: string;                  // 人类可读名称
  category: string;              // 分类
  route: 'rule' | 'agent';       // 预期路径
  input: string;                 // 用户指令原文
  zone?: 'driver' | 'passenger'; // 默认 driver
  requiredTools: string[];       // 必须调用的工具（全部命中才算满分）
  keyArgs?: Record<string, unknown>; // 必须正确的关键参数
  latencyMs: number;             // 超时阈值（rule: 300, agent: 8000）
}
```

### 分类与数量

| 分类 | 数量 | Rule | Agent | 包含模糊指令 |
|------|------|------|-------|------------|
| 音乐控制 | 10 | 6 | 4 | ✓ |
| 温度/空调 | 12 | 4 | 8 | ✓ |
| 氛围灯 | 5 | 0 | 5 | ✓ |
| 车窗/天窗 | 5 | 3 | 2 | ✓ |
| 座椅 | 5 | 0 | 5 | ✓ |
| 副驾/多区域指令 | 6 | 0 | 6 | ✓ |
| 复合多步场景 | 14 | 0 | 14 | — |
| 导航（查找+设置）| 8 | 0 | 8 | ✓ |
| 查询类 | 5 | 0 | 5 | — |
| 边界/低频 | 5 | 2 | 3 | ✓ |
| **合计** | **75** | **15** | **60** | |

### 复合多步场景示例（14 条）

| 场景 | 指令示例 | 预期工具 |
|------|---------|---------|
| 睡眠模式 | 我要睡觉了 | set_zero_gravity, set_ambient_light, pause_music |
| 高速行驶 | 准备上高速 | set_all_windows, set_air_circulation, set_ac |
| 晕车处理 | 有点晕车 | set_window, set_air_circulation, pause_music |
| 到达目的地 | 快到了收拾一下 | pause_music, set_all_windows |
| 夜驾模式 | 开个夜驾模式 | set_ambient_light, set_temperature |
| 全家出行 | 全家出行调一下 | set_temperature(all), set_ambient_light |
| 商务接待 | 商务接待模式 | set_fragrance, set_ambient_light, set_temperature |
| 副驾休息 | 副驾想睡觉帮她调好 | set_zero_gravity(passenger), set_temperature(rear) |
| 雨天模式 | 开始下雨了 | set_all_windows, set_defrost |
| 休息氛围 | 帮我营造休息的氛围 | set_temperature, set_ambient_light |
| 节能模式 | 开节能模式 | set_climate_auto, set_ambient_light |
| 天黑调节 | 天黑了调一下 | set_ambient_light, set_temperature |
| 运动模式 | 开个运动模式 | set_ambient_light, play_music |
| 保存当前场景 | 把现在的设置存成我的睡眠模式 | save_scene |

---

## 5. 评估维度（6 项）

### 计分维度

| 维度 | 权重 | 计算方式 |
|------|------|---------|
| 工具命中率 | 30% | 实际调用 ∩ 期望工具 / 期望工具数（按比例）|
| 参数正确率 | 25% | keyArgs 中关键字段（zone、value 等）正确率 |
| 推理链完整率 | 20% | Agent 路径出现 intent + decide 步骤（仅计 Agent 用例）|
| 延迟达标率 | 12% | Rule < 300ms，Agent < 8s |
| 音区路由准确率 | 8% | 涉及主副驾的用例，zone 参数是否作用到正确区域 |
| 路由精准度 | 5% | rule vs agent 路径判断是否正确 |

**综合得分** = 六项加权平均，0–100 分。

### 附加指标（不计入总分）

- **冗余调用率**：不必要工具调用占总调用次数的比例（越低越好）
- **回复质量**：简单操作回复 > 10 字、或含禁用词（"为您"/"非常抱歉"）的用例数

---

## 6. 运行逻辑（runner.ts）

单条用例执行流程：

```
1. 记录开始时间
2. 调用 route(input, vehicleState, zone)
   → 若返回 rule：直接 handleTool()，记录工具名+参数
   → 若返回 agent：创建 mock emitter，调用 runAgentLoop()
      - emitter 收集所有 reasoning steps（type/toolName/toolArgs）
      - 收集所有 vehicle_patch 事件
3. 记录结束时间，计算延迟
4. 对比 EvalCase 期望值，输出 EvalResult
```

每次用例开始前重置 vehicleState 为默认值，避免用例间状态污染。

---

## 7. 输出格式

### 终端

```
🧪 智能座舱 Agent 评估  (75 条用例)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Rule]  R01  暂停音乐               ✓   38ms
[Agent] A01  帮我营造休息的氛围      ✓  2341ms
[Agent] A03  副驾太热了帮她调一下    ✗  3102ms
...

失败明细：

✗ A03  副驾太热了帮她调一下
  工具命中:   50%  期望 [set_temperature, set_fan_speed(rear)]
                   实际 [set_temperature(front)]
  参数正确:    ✗   zone 应为 rear，实际 front
  音区路由:    ✗
  推理链:      ✓   intent + decide 均出现
  延迟:        ✓   3102ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
综合得分：79 分  (61/75 通过)

工具命中率    ██████████████░░  86%
参数正确率    ████████████░░░░  74%
推理链完整率  ███████████████░  92%
延迟达标率    ████████████████  98%
音区路由准确  ██████████░░░░░░  68%
路由精准度    ████████████████  100%

附加指标：
冗余调用率    8%（6 次多余工具调用）
回复质量问题  2 条

结果已保存 → backend/eval/results/2026-06-25T14:32:11.json
```

### 结果文件（JSON）

存储路径：`backend/eval/results/<timestamp>.json`，加入 `.gitignore`。

结构：
```json
{
  "timestamp": "2026-06-25T14:32:11",
  "summary": { "total": 75, "passed": 61, "scores": {...} },
  "results": [ { "caseId": "A03", "passed": false, ... } ]
}
```

### Diff 输出（`npm run eval:diff`）

```
📊 与上次结果对比（2026-06-25T14:32 → 2026-06-25T16:10）

✓ 新增通过  A03  副驾太热了帮她调一下   参数正确率修复
✓ 新增通过  A14  有点热
✗ 新增失败  A22  我要睡觉了            ⚠ 回归退化

综合得分  79 → 84  (+5)
```

---

## 8. 迭代优化工作流

```
运行 npm run eval
    ↓
查看失败明细，找规律
（同一类场景集中失败？同一参数字段总错？）
    ↓
修改 prompts/system.ts 或 router/rules.ts
    ↓
再次运行 npm run eval
    ↓
运行 npm run eval:diff
检查：bad case 修好了吗？有没有回归退化？
    ↓
重复，直到综合得分达到目标（建议 ≥ 90 分）
```

---

## 9. 目标基准

| 维度 | 目标 |
|------|------|
| Rule 路由精准度 | 100%（确定性规则）|
| Agent 工具命中率 | ≥ 85% |
| 参数正确率 | ≥ 80% |
| 推理链完整率 | ≥ 85% |
| 延迟达标率 | ≥ 95% |
| **综合得分** | **≥ 90 分** |
