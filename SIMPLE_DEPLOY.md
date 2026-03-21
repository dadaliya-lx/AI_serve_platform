# 简单部署指南 - Render + Cloudflare Pages

## 第一步：部署后端到 Render

### 1. 准备 GitHub 仓库

首先需要将代码上传到 GitHub：

```bash
# 在项目根目录执行
git init
git add .
git commit -m "Initial commit"
```

然后在 GitHub 创建一个新仓库，并推送代码：
```bash
git remote add origin https://github.com/你的用户名/你的仓库名.git
git branch -M main
git push -u origin main
```

### 2. 在 Render 创建服务

1. 访问 https://render.com 并用 GitHub 登录
2. 点击 **New** → **Web Service**
3. 选择你的 GitHub 仓库
4. 填写配置：

| 设置项 | 值 |
|--------|-----|
| Name | city-service-backend |
| Root Directory | backend |
| Environment | Python 3 |
| Build Command | pip install -r requirements.txt |
| Start Command | python app.py |
| Instance Type | Free |

5. 点击 **Create Web Service**

### 3. 等待部署完成

部署大约需要 2-3 分钟。完成后你会获得一个 URL：
```
https://city-service-backend.onrender.com
```

---

## 第二步：部署前端到 Cloudflare Pages

### 1. 在 Cloudflare 创建项目

1. 访问 https://dash.cloudflare.com
2. 点击左侧 **Workers & Pages**
3. 点击 **Create application** → **Pages** → **Connect to Git**
4. 选择你的 GitHub 仓库
5. 填写配置：

| 设置项 | 值 |
|--------|-----|
| Project name | city-service |
| Production branch | main |
| Build command | (留空) |
| Build output directory | / |

6. 点击 **Save and Deploy**

### 2. 获取前端 URL

部署完成后，你会获得：
```
https://city-service.pages.dev
```

---

## 第三步：连接前后端

### 修改前端 API 地址

编辑 `js/api-client.js` 文件，将第一行改为：

```javascript
const API_BASE_URL = "https://city-service-backend.onrender.com/api";
```

然后重新推送到 GitHub：
```bash
git add .
git commit -m "Update API URL"
git push
```

Cloudflare Pages 会自动重新部署。

---

## 完成！

现在你的网站已经上线了：
- 前端：https://city-service.pages.dev
- 后端：https://city-service-backend.onrender.com

## 注意事项

1. **Render 免费服务会休眠**：15分钟无访问后会休眠，首次访问需要等待 30 秒唤醒

2. **数据库**：Render 免费版 SQLite 数据库会在重新部署时重置。如需持久化数据，建议使用外部数据库（如 Supabase）

3. **测试**：部署后先测试注册和登录功能

## 常见问题

### 后端部署失败
检查 `requirements.txt` 是否正确

### 前端无法连接后端
1. 检查 API_BASE_URL 是否正确
2. 确认后端已成功部署

### 注册/登录失败
查看 Render 的日志，检查错误信息
