# 长期部署说明

本项目建议部署为一个 Node Web Service：前端先构建到 `frontend/dist`，再由 Express 后端同源托管。这样公开访问时只有一个 HTTPS 链接，`/chat` 的 SSE 流和静态页面不会出现跨域或 `localhost` 失效问题。

## 推荐平台：Netlify

Netlify 不需要使用 Render Blueprint。当前仓库已包含 `netlify.toml` 和 `netlify/functions/chat.mts`，可以直接从 GitHub 导入部署。

1. 打开 Netlify，选择 **Add new site** -> **Import an existing project**。
2. 连接 GitHub，选择仓库 `x1322811-dev/cockpit-demo`。
3. 构建设置保持默认，Netlify 会读取 `netlify.toml`：
   - Build command: `npm run install:all && npm run build`
   - Publish directory: `frontend/dist`
   - Functions directory: `netlify/functions`
4. 在 **Environment variables** 中添加：
   - `DEEPSEEK_API_KEY`: 你的 DeepSeek API Key
5. 点击部署。完成后 Netlify 会生成类似 `https://cockpit-demo.netlify.app` 的公开链接。

### Netlify 注意事项

前端页面和 `/chat` 函数在同一个域名下工作，不需要额外配置 `VITE_API_BASE_URL`。Netlify Functions 支持流式响应，但免费/默认函数有执行时间限制，适合面试演示；特别复杂的多轮 Agent 请求如果超过平台时限，可能需要换成长驻 Node 服务。

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
