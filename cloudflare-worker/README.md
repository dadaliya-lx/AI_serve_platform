# Cloudflare 全栈部署指南（前端 + 后端）

## 前置要求

1. Cloudflare 账号（免费）
2. Node.js 18+ 已安装
3. npm 包管理器

## 部署步骤

### 第一步：部署后端到 Cloudflare Workers

#### 1. 安装依赖

```bash
cd cloudflare-worker
npm install
```

#### 2. 登录 Cloudflare

```bash
npx wrangler login
```

#### 3. 创建 D1 数据库

```bash
npx wrangler d1 create city-service-db
```

执行后会输出：
```
✅ Successfully created DB 'city-service-db'!

[[d1_databases]]
binding = "DB"
database_name = "city-service-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

#### 4. 更新 wrangler.toml

复制上一步输出的 `database_id` 到 `cloudflare-worker/wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "city-service-db"
database_id = "粘贴你的database_id"
```

#### 5. 初始化数据库

```bash
npx wrangler d1 execute city-service-db --file=./schema.sql
```

#### 6. 本地测试

```bash
npm run dev
```

访问 http://localhost:8787 测试 API。

#### 7. 部署到 Cloudflare

```bash
npm run deploy
```

部署成功后会显示：
```
✨ Successfully published your Worker to
  https://city-service-backend.你的子域名.workers.dev
```

---

### 第二步：部署前端到 Cloudflare Pages

#### 1. 准备代码

确保前端代码在项目根目录（index.html, css/, js/, images/ 等）

#### 2. 在 Cloudflare 创建 Pages 项目

1. 访问 https://dash.cloudflare.com
2. 点击 **Workers & Pages**
3. 点击 **Create application** → **Pages** → **Connect to Git**
4. 选择你的 GitHub 仓库：`AI-city-public-service-platfom`
5. 点击 **Begin setup**

#### 3. 配置构建设置

| 设置项 | 值 |
|--------|-----|
| Project name | city-service |
| Production branch | main |
| Build command | (留空) |
| Build output directory | / |

#### 4. 部署

点击 **Save and Deploy**，等待 2-3 分钟。

部署成功后会显示：
```
https://city-service.pages.dev
```

---

### 第三步：连接前后端

#### 1. 更新前端 API 地址

编辑 `js/api-client.js` 文件，将第一行改为：

```javascript
const API_BASE_URL = "https://city-service-backend.你的子域名.workers.dev/api";
```

#### 2. 重新部署前端

修改后，提交到 GitHub：

```bash
git add js/api-client.js
git commit -m "Update API URL"
git push
```

Cloudflare Pages 会自动重新部署。

---

## 完成！

现在你的网站已经上线了：
- 前端：https://city-service.pages.dev
- 后端：https://city-service-backend.你的子域名.workers.dev

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 本地开发服务器 |
| `npm run deploy` | 部署到生产环境 |
| `npx wrangler d1 execute city-service-db --command="SELECT * FROM users"` | 执行 SQL 查询 |
| `npx wrangler tail` | 查看实时日志 |

## 注意事项

1. **JWT_SECRET**: 生产环境中请修改为安全的随机字符串：
   ```bash
   npx wrangler secret put JWT_SECRET
   # 然后输入你的密钥
   ```

2. **文件上传**: Cloudflare Workers 不支持文件系统，如需图片上传功能，请使用 Cloudflare R2 存储

3. **免费额度**:
   - Workers: 每天 100,000 次请求
   - D1: 5GB 存储，每天 500 万行读取

## 故障排除

### 数据库连接失败
检查 `wrangler.toml` 中的 `database_id` 是否正确。

### CORS 错误
确保 `src/index.js` 中已启用 CORS。

### Token 验证失败
检查 JWT_SECRET 在 Worker 和前端是否一致。

### 部署失败
检查 `package.json` 中的依赖是否正确安装。
