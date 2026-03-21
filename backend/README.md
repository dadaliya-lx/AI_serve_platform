# 城市公共设施服务平台 - 后端部署文档

## 技术栈
- 后端框架：Flask (Python)
- 数据库：SQLite
- 认证：JWT (JSON Web Token)
- 文件上传：本地存储

## 环境要求
- Python 3.7+
- pip (Python包管理器)

## 安装步骤

### 1. 安装Python依赖
```bash
cd backend
pip install -r requirements.txt
```

### 2. 启动后端服务
```bash
cd backend
python app.py
```

后端服务将在 `http://localhost:5000` 启动

### 3. 访问前端
在浏览器中打开 `index.html` 或其他前端页面

## API接口文档

### 用户相关接口

#### 1. 用户注册
- **接口**：`POST /api/register`
- **参数**：
  - `name`: 姓名
  - `phone`: 手机号
  - `password`: 密码
- **返回**：
  ```json
  {
    "success": true,
    "message": "注册成功"
  }
  ```

#### 2. 用户登录
- **接口**：`POST /api/login`
- **参数**：
  - `phone`: 手机号
  - `password`: 密码
- **返回**：
  ```json
  {
    "success": true,
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "name": "用户名",
      "phone": "手机号",
      "avatar": "头像URL"
    }
  }
  ```

#### 3. 获取用户信息
- **接口**：`GET /api/user/profile`
- **认证**：需要JWT Token
- **返回**：用户信息

#### 4. 更新用户信息
- **接口**：`PUT /api/user/profile`
- **认证**：需要JWT Token
- **参数**：
  - `name`: 姓名（可选）
  - `avatar`: 头像URL（可选）

### 报修相关接口

#### 1. 提交报修
- **接口**：`POST /api/repairs`
- **认证**：需要JWT Token
- **参数**：
  - `facility_type`: 设施类型
  - `damage_type`: 损坏类型
  - `location`: 位置信息
  - `description`: 详细描述
  - `image`: 图片文件（可选）
- **返回**：
  ```json
  {
    "success": true,
    "repair_id": "R1234567890"
  }
  ```

#### 2. 获取用户报修列表
- **接口**：`GET /api/repairs`
- **认证**：需要JWT Token
- **返回**：报修列表

#### 3. 查询单个报修
- **接口**：`GET /api/repairs/<repair_id>`
- **认证**：需要JWT Token
- **返回**：报修详情

### 管理员相关接口

#### 1. 获取所有报修
- **接口**：`GET /api/admin/repairs`
- **认证**：需要JWT Token
- **返回**：所有报修列表（包含用户信息）

#### 2. 更新报修状态
- **接口**：`PUT /api/admin/repairs/<id>`
- **认证**：需要JWT Token
- **参数**：
  - `status`: 状态（pending/accepted/processing/completed/rejected）
  - `progress`: 进度（0-100）
  - `admin_note`: 管理员备注（可选）
- **返回**：
  ```json
  {
    "success": true,
    "message": "更新成功"
  }
  ```

## 数据库结构

### User（用户表）
- `id`: 用户ID
- `name`: 姓名
- `phone`: 手机号（唯一）
- `password`: 密码（加密）
- `avatar`: 头像URL
- `created_at`: 创建时间

### Repair（报修表）
- `id`: 记录ID
- `repair_id`: 报修编号（唯一）
- `user_id`: 用户ID（外键）
- `facility_type`: 设施类型
- `damage_type`: 损坏类型
- `location`: 位置信息
- `description`: 详细描述
- `image`: 图片路径
- `status`: 状态
- `progress`: 进度
- `admin_note`: 管理员备注
- `submit_time`: 提交时间
- `update_time`: 更新时间

### Admin（管理员表）
- `id`: 管理员ID
- `username`: 用户名（唯一）
- `password`: 密码（加密）
- `name`: 姓名
- `created_at`: 创建时间

## 前端对接说明

### 1. 引入API客户端
在HTML文件中添加：
```html
<script src="js/api-client.js"></script>
```

### 2. 使用API客户端
```javascript
// 注册
const result = await APIClient.register(name, phone, password);

// 登录
const result = await APIClient.login(phone, password);
localStorage.setItem('token', result.token);

// 提交报修
const formData = new FormData();
formData.append('facility_type', '路灯');
formData.append('damage_type', '灯泡损坏');
formData.append('location', 'XX路XX号');
formData.append('description', '路灯不亮');
const result = await APIClient.submitRepair(formData);

// 获取报修列表
const repairs = await APIClient.getRepairs();
```

## 部署到生产环境

### 1. 修改配置
编辑 `backend/config.py`，修改以下配置：
```python
SECRET_KEY = 'your-production-secret-key'
JWT_SECRET_KEY = 'your-production-jwt-secret'
```

### 2. 使用生产服务器
- 部署到云服务器（阿里云、腾讯云等）
- 配置反向代理（Nginx）
- 启用HTTPS

### 3. 数据库备份
定期备份 `city_service.db` 文件

## 常见问题

### 1. 端口被占用
修改 `app.py` 最后一行：
```python
app.run(debug=True, port=8000)  # 改为其他端口
```

### 2. CORS错误
确保 `app.py` 中已启用CORS：
```python
CORS(app)
```

### 3. 数据库初始化失败
删除 `city_service.db` 文件，重新启动服务

## 开发团队
- 前端：HTML/CSS/JavaScript
- 后端：Python Flask
- 数据库：SQLite

## 许可证
MIT License