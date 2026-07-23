# 座舱 HMI 质感升级设计

## 目标

将前端从偏“文字与控件密集”的演示界面，升级为更有真实智能座舱 HMI 感的展示界面，同时不依赖生成式图片资产或外部图片 API。

优先方向是“座舱数字孪生 + 演示舞台感”的混合方案：

- 让左上角座舱模拟区域更像真实车内空间的数字孪生。
- 保留当前 Swiss 视觉语言：白底、黑色结构线、克制排版、橙色强调。
- 增加必要的状态联动与轻量动效，让面试演示时页面更“活”。

## 范围

本设计只涉及前端，不改变后端工具、Agent 路由、SSE 事件或车辆状态类型。

主要涉及：

- `frontend/src/components/cockpit/CockpitPanel.tsx`
- `frontend/src/components/cockpit/DriverZone.tsx`
- `frontend/src/components/cockpit/PassengerZone.tsx`
- `frontend/src/components/cockpit/PublicZone.tsx`
- `frontend/src/index.css`

可新增组件：

- `frontend/src/components/cockpit/CockpitTwinView.tsx`

## 推荐方案

新增 `CockpitTwinView` 组件，并将它渲染在 `CockpitPanel` 的上半部分。

该组件使用 CSS / SVG / HTML 绘制，不使用图片文件。它作为当前车辆状态的空间化总览，表达以下内容：

- 车辆座舱轮廓
- 主驾与副驾座椅
- 方向盘与中控区域
- 主驾/副驾车窗
- 全景天窗
- 氛围灯光带
- 空调风向与风量
- 零重力、加热、通风、按摩等座椅舒适状态

现有控制卡片仍然是主要交互入口。`CockpitTwinView` 以视觉映射为主，只保留少量轻交互，例如高亮主驾/副驾区域，或展示当前驾驶速度状态。

## 布局

当前布局：

```text
CockpitPanel
├─ 顶部标题 + 速度选择
├─ DriverZone | PassengerZone
└─ PublicZone
```

目标布局：

```text
CockpitPanel
├─ 顶部标题 + 速度选择
├─ CockpitTwinView
│  ├─ 座舱外壳
│  ├─ 主驾/副驾座椅
│  ├─ 车窗与天窗表面
│  ├─ 氛围灯光带
│  └─ 空调风向 / 舒适状态叠层
├─ DriverZone | PassengerZone
└─ PublicZone
```

`CockpitTwinView` 应保持紧凑，高度大约控制在 118-150px，具体根据可用空间微调。它不应显著挤压下方 `StateDiff` 区域，也不应让左侧列变得拥挤。

## 视觉语言

座舱数字孪生应该像精确的 HMI 示意图，而不是海报插画。

使用：

- 细黑色结构线
- 柔和半透明玻璃填充
- 与 Agent/活跃状态相关的橙色强调
- 米白与石墨色的座椅表面
- 来自 `ambientLight.color` 的克制彩色光带
- 只在承载状态变化时使用动效：空调气流、灯光变化、车窗运动、座椅姿态变化

避免：

- 深色科幻仪表盘风格
- 大面积霓虹渐变
- 装饰性光斑或无关背景图形
- 与当前 Swiss 设计冲突的真实照片
- 在数字孪生区域堆叠密集文字标签

## 状态映射

`CockpitTwinView` 从现有 Zustand store 读取状态，并使用 `useShallow` 避免多属性 selector 导致重复渲染问题。

映射关系：

- `climate.acFront` / `acRear`：控制主驾/副驾空调气流显示或隐藏。
- `climate.fanSpeed` / `fanSpeedRear`：控制气流标记数量、透明度或动画速度。
- `climate.airflowMode` / `airflowModeRear`：控制气流朝向，例如吹脸、吹脚或扩散。
- `ambientLight.on`、`color`、`brightness`：控制氛围灯光带的可见性、颜色和透明度。
- `windows.driverWindow` / `passengerWindow`：展示车窗开启百分比。
- `windows.sunroof`：展示天窗通透或遮阳状态。
- `seat.zeroGravity` / `seatPassenger.zeroGravity`：改变座椅姿态或增加零重力高亮。
- `seat.heating`、`ventilation`、`massage`：在座椅附近显示小型状态点或状态符号。
- `drive.speed`：如果空间允许，可作为道路速度条或座舱运动提示；它不属于第一版验收标准。

不需要新增全局状态。

## 交互模型

数字孪生区域不应复制所有控制项，否则会让座舱区域显得繁忙。

推荐交互：

- 鼠标悬停主驾或副驾区域时，轻微高亮对应区域。
- 点击主驾/副驾座椅时，可选地在视觉上引导到对应控制卡片；第一版可以不做。
- 精确控制仍保留在现有 `DriverZone`、`PassengerZone` 和 `PublicZone` 中。

这样可以让 `CockpitTwinView` 保持为状态可视化层，而不是新的复杂控制面板。

## 周边打磨

加入数字孪生后，对周边区域做轻量整理：

- 压缩主驾/副驾重复卡片的间距，为数字孪生留出空间。
- 统一活跃控件的强调样式。
- 为状态变化增加 160-260ms 左右的短过渡。
- 如果不扩大范围，可轻微强化 `ReasoningPanel` 的阶段表现，让 Agent 操作更像正在驱动座舱状态变化。

## 组件边界

`CockpitTwinView` 应保持自包含：

- 组件内部负责全部座舱几何与视觉结构。
- 初始版本不接收 props，像其他 cockpit 组件一样直接读取 store。
- 第一版不修改车辆状态。
- 只在文件内部放置小型局部 helper 组件，除非后续出现明确复用需求。

这样可以让第一版实现聚焦，避免引入大范围重构。

## 验收标准

满足以下条件即可认为第一版成功：

- 左上座舱区域第一眼能读出“智能车辆座舱”，而不只是表单式控件。
- 主驾与副驾区域在视觉上清晰区分。
- 车窗、天窗、氛围灯、空调气流、零重力状态能在数字孪生中体现。
- 现有控制仍然可用，并能同时更新控制卡片与数字孪生区域。
- 页面在常见桌面尺寸下仍保持可读。
- 实现不引入外部图片生成依赖。
- TypeScript 与 lint 检查通过。

## 风险

主要风险是座舱区域变得过高或过度装饰。数字孪生应该被视为紧凑的 HMI 示意图，详细控制仍由现有控件承担。

另一个风险是过早抽象。第一版应优先使用单个聚焦的 `CockpitTwinView.tsx`，除非文件确实变得难以维护，否则不需要拆出一套小型渲染框架。

## 不在范围内

- 生成式位图资产
- 3D 渲染库
- 后端状态变更
- 新增车辆能力
- 移动端优先重设计
- 完整主题替换
