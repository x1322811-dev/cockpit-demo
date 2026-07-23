# 长期部署说明

本项目建议部署为一个 Node Web Service：前端先构建到 `frontend/dist`，再由 Express 后端同源托管。这样公开访问时只有一个 HTTPS 链接，`/chat` 的 SSE 流和静态页面不会出现跨域或 `localhost` 失效问题。

## 推荐平台：Render

1. 将代码推送到 GitHub 仓库：`x1322811-dev/cockpit-demo`。
2. 登录 Render，选择 **New +** -> **Blueprint**。
3. 连接 GitHub 仓库 `x1322811-dev/cockpit-demo`。
4. Render 会读取仓库根目录的 `render.yaml`。
5. 在环境变量里填入：
   - `DEEPSEEK_API_KEY`: 你的 DeepSeek API Key
6. 部署完成后，Render 会生成类似 `https://cockpit-demo.onrender.com` 的长期链接。

## 本地生产模式验证

```bash
npm run install:all
npm run build
DEEPSEEK_API_KEY=sk-... npm start
```

打开 `http://localhost:3001`，前端页面和 `/chat` 后端接口会在同一个服务下工作。

## API 地址策略

前端默认使用相对路径 `/chat`，适合生产同源部署。若以后需要前后端分开部署，可以设置：

```bash
VITE_API_BASE_URL=https://your-backend.example.com
```
