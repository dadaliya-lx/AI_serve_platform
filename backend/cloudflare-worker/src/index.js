import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

const JWT_SECRET = "your-jwt-secret-key-change-in-production";

// 使用 Web Crypto API 进行密码哈希
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + JWT_SECRET);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(password, hashedPassword) {
  const hash = await hashPassword(password);
  return hash === hashedPassword;
}

// 使用 Web Crypto API 生成 JWT
async function generateToken(userId) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { userId, exp: Date.now() + 24 * 60 * 60 * 1000 };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(payload));
  const data = encoder.encode(`${headerB64}.${payloadB64}`);

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, data);
  const sigArray = Array.from(new Uint8Array(signature));
  const sigB64 = btoa(String.fromCharCode(...sigArray));

  return `${headerB64}.${payloadB64}.${sigB64}`;
}

async function verifyToken(token) {
  try {
    const [headerB64, payloadB64, sigB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !sigB64) return null;

    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const signature = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify("HMAC", key, signature, data);

    if (!isValid) return null;

    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch (error) {
    return null;
  }
}

// 健康检查接口
app.get("/api/health", async (c) => {
  return c.json({
    success: true,
    message: "服务正常运行",
    timestamp: new Date().toISOString(),
  });
});

// 根路径测试
app.get("/", async (c) => {
  return c.json({
    success: true,
    message: "API 服务正常运行",
    endpoints: [
      "GET /api/health - 健康检查",
      "POST /api/register - 用户注册",
      "POST /api/login - 用户登录",
      "GET /api/user/profile - 获取用户信息",
      "POST /api/repairs - 提交报修",
      "GET /api/repairs - 获取报修列表",
    ],
  });
});

// 测试路由
app.get("/test", async (c) => {
  return c.json({ success: true, message: "测试路由正常" });
});

// 工具函数：验证手机号
function validatePhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// 工具函数：验证密码强度
function validatePassword(password) {
  return password.length >= 6;
}

// 工具函数：清理输入防止 XSS
function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// 注册接口
app.post("/api/register", async (c) => {
  const db = c.env.DB;

  try {
    const body = await c.req.json();
    const { name, phone, password } = body;

    // 输入验证
    if (!name || name.trim().length < 2) {
      return c.json({ success: false, message: "姓名至少需要2个字符" }, 422);
    }

    if (!validatePhone(phone)) {
      return c.json({ success: false, message: "请输入正确的手机号" }, 422);
    }

    if (!validatePassword(password)) {
      return c.json({ success: false, message: "密码至少需要6个字符" }, 422);
    }

    // 检查手机号是否已注册
    const existingUser = await db
      .prepare("SELECT id FROM users WHERE phone = ?")
      .bind(phone)
      .first();

    if (existingUser) {
      return c.json({ success: false, message: "该手机号已注册" }, 409);
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    await db
      .prepare("INSERT INTO users (name, phone, password) VALUES (?, ?, ?)")
      .bind(sanitizeInput(name.trim()), phone, hashedPassword)
      .run();

    return c.json({ success: true, message: "注册成功" });
  } catch (error) {
    console.error("Register error:", error);
    return c.json({ success: false, message: "注册失败，请稍后重试" }, 500);
  }
});

// 登录接口
app.post("/api/login", async (c) => {
  const db = c.env.DB;

  try {
    const body = await c.req.json();
    const { phone, password } = body;

    // 输入验证
    if (!validatePhone(phone)) {
      return c.json({ success: false, message: "请输入正确的手机号" }, 422);
    }

    if (!password) {
      return c.json({ success: false, message: "请输入密码" }, 422);
    }

    // 查询用户
    const user = await db
      .prepare("SELECT id, name, phone, password FROM users WHERE phone = ?")
      .bind(phone)
      .first();

    if (!user) {
      return c.json({ success: false, message: "手机号或密码错误" }, 401);
    }

    // 验证密码
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return c.json({ success: false, message: "手机号或密码错误" }, 401);
    }

    // 生成 Token
    const token = await generateToken(user.id);

    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ success: false, message: "登录失败，请稍后重试" }, 500);
  }
});

// 获取用户信息
app.get("/api/user/profile", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      return c.json({ success: false, message: "Token 无效或已过期" }, 401);
    }

    const db = c.env.DB;
    const user = await db
      .prepare("SELECT id, name, phone, created_at FROM users WHERE id = ?")
      .bind(decoded.userId)
      .first();

    if (!user) {
      return c.json({ success: false, message: "用户不存在" }, 404);
    }

    return c.json({ success: true, user });
  } catch (error) {
    console.error("Get user profile error:", error);
    return c.json({ success: false, message: "获取用户信息失败" }, 500);
  }
});

// 更新用户信息
app.put("/api/user/profile", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      return c.json({ success: false, message: "Token 无效或已过期" }, 401);
    }

    const db = c.env.DB;
    const body = await c.req.json();

    // 构建更新字段
    const updates = [];
    const values = [];

    if (body.name) {
      updates.push("name = ?");
      values.push(sanitizeInput(body.name.trim()));
    }

    if (updates.length === 0) {
      return c.json({ success: false, message: "没有要更新的内容" }, 422);
    }

    values.push(decoded.userId);

    await db
      .prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    return c.json({ success: true, message: "更新成功" });
  } catch (error) {
    console.error("Update user profile error:", error);
    return c.json({ success: false, message: "更新失败" }, 500);
  }
});

// 提交报修
app.post("/api/repairs", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      return c.json({ success: false, message: "Token 无效或已过期" }, 401);
    }

    const db = c.env.DB;
    const body = await c.req.json();

    // 生成唯一报修ID
    function generateRepairId() {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `R${timestamp}${random}`;
    }

    // 创建报修记录
    await db
      .prepare(
        "INSERT INTO repairs (repair_id, user_id, facility_type, damage_type, location, description, image, status, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        generateRepairId(),
        decoded.userId,
        body.facility_type || null,
        body.damage_type || null,
        sanitizeInput(body.location || ""),
        sanitizeInput(body.description || ""),
        body.image || null,
        "pending",
        0,
      )
      .run();

    return c.json({ success: true, message: "报修提交成功" });
  } catch (error) {
    console.error("Submit repair error:", error);
    return c.json({ success: false, message: "报修提交失败" }, 500);
  }
});

// 获取报修列表
app.get("/api/repairs", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      return c.json({ success: false, message: "Token 无效或已过期" }, 401);
    }

    const db = c.env.DB;
    const repairs = await db
      .prepare(
        "SELECT * FROM repairs WHERE user_id = ? ORDER BY submit_time DESC",
      )
      .bind(decoded.userId)
      .all();

    return c.json({ success: true, repairs: repairs.results || [] });
  } catch (error) {
    console.error("Get repairs error:", error);
    return c.json({ success: false, message: "获取报修列表失败" }, 500);
  }
});

// 获取报修详情
app.get("/api/repairs/:repair_id", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];
  const repairId = c.req.param("repair_id");

  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      return c.json({ success: false, message: "Token 无效或已过期" }, 401);
    }

    const db = c.env.DB;
    const repair = await db
      .prepare("SELECT * FROM repairs WHERE repair_id = ? AND user_id = ?")
      .bind(repairId, decoded.userId)
      .first();

    if (!repair) {
      return c.json({ success: false, message: "报修记录不存在" }, 404);
    }

    return c.json({ success: true, repair });
  } catch (error) {
    console.error("Get repair detail error:", error);
    return c.json({ success: false, message: "获取报修详情失败" }, 500);
  }
});

// 删除报修
app.delete("/api/repairs/:repair_id", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];
  const repairId = c.req.param("repair_id");

  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      return c.json({ success: false, message: "Token 无效或已过期" }, 401);
    }

    const db = c.env.DB;
    await db
      .prepare("DELETE FROM repairs WHERE repair_id = ? AND user_id = ?")
      .bind(repairId, decoded.userId)
      .run();

    return c.json({ success: true, message: "删除成功" });
  } catch (error) {
    console.error("Delete repair error:", error);
    return c.json({ success: false, message: "删除失败" }, 500);
  }
});

// 获取通知列表
app.get("/api/notifications", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      return c.json({ success: false, message: "Token 无效或已过期" }, 401);
    }

    const db = c.env.DB;
    const notifications = await db
      .prepare(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      )
      .bind(decoded.userId)
      .all();

    return c.json({
      success: true,
      notifications: notifications.results || [],
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return c.json({ success: false, message: "获取通知列表失败" }, 500);
  }
});

// 标记通知为已读
app.put("/api/notifications/:id/read", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];
  const notificationId = c.req.param("id");

  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      return c.json({ success: false, message: "Token 无效或已过期" }, 401);
    }

    const db = c.env.DB;

    await db
      .prepare(
        "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      )
      .bind(notificationId, decoded.userId)
      .run();

    return c.json({ success: true, message: "标记已读成功" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return c.json({ success: false, message: "标记失败" }, 500);
  }
});

// 获取未读通知数量
app.get("/api/notifications/unread-count", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      return c.json({ success: false, message: "Token 无效或已过期" }, 401);
    }

    const db = c.env.DB;

    const result = await db
      .prepare(
        "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0",
      )
      .bind(decoded.userId)
      .first();

    return c.json({ success: true, count: result?.count || 0 });
  } catch (error) {
    console.error("Get unread count error:", error);
    return c.json({ success: false, message: "获取未读数量失败" }, 500);
  }
});

// 获取新闻列表
app.get("/api/news", async (c) => {
  try {
    const db = c.env.DB;
    const news = await db
      .prepare("SELECT * FROM news ORDER BY created_at DESC")
      .all();

    return c.json({ success: true, news: news.results || [] });
  } catch (error) {
    console.error("Get news error:", error);
    return c.json({ success: false, message: "获取新闻列表失败" }, 500);
  }
});

// 管理员：获取所有报修
app.get("/api/admin/repairs", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await verifyToken(token);
    const db = c.env.DB;

    // 检查是否为管理员
    const admin = await db
      .prepare("SELECT id FROM admins WHERE id = ?")
      .bind(decoded.userId)
      .first();

    if (!admin) {
      return c.json({ success: false, message: "无权访问" }, 403);
    }

    const repairs = await db
      .prepare(
        `
      SELECT r.*, u.name as user_name, u.phone as user_phone
      FROM repairs r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.submit_time DESC
    `,
      )
      .all();

    return c.json({ success: true, repairs: repairs.results || [] });
  } catch (error) {
    console.error("Admin get repairs error:", error);
    return c.json({ success: false, message: "获取报修列表失败" }, 500);
  }
});

// 管理员：更新报修状态
app.put("/api/admin/repairs/:id", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];
  const repairId = c.req.param("id");

  try {
    const decoded = await verifyToken(token);
    const db = c.env.DB;
    const body = await c.req.json();

    // 检查是否为管理员
    const admin = await db
      .prepare("SELECT id FROM admins WHERE id = ?")
      .bind(decoded.userId)
      .first();

    if (!admin) {
      return c.json({ success: false, message: "无权访问" }, 403);
    }

    // 验证状态值
    const validStatuses = ["pending", "processing", "completed", "cancelled"];
    if (body.status && !validStatuses.includes(body.status)) {
      return c.json({ success: false, message: "无效的状态值" }, 422);
    }

    // 验证进度值
    if (
      body.progress !== undefined &&
      (body.progress < 0 || body.progress > 100)
    ) {
      return c.json({ success: false, message: "进度值必须在0-100之间" }, 422);
    }

    // 构建更新字段
    const updates = [];
    const values = [];

    if (body.status) {
      updates.push("status = ?");
      values.push(body.status);
    }

    if (body.progress !== undefined) {
      updates.push("progress = ?");
      values.push(body.progress);
    }

    if (body.admin_note !== undefined) {
      updates.push("admin_note = ?");
      values.push(sanitizeInput(body.admin_note));
    }

    if (updates.length === 0) {
      return c.json({ success: false, message: "没有要更新的内容" }, 422);
    }

    updates.push("update_time = CURRENT_TIMESTAMP");
    values.push(repairId);

    await db
      .prepare(`UPDATE repairs SET ${updates.join(", ")} WHERE repair_id = ?`)
      .bind(...values)
      .run();

    return c.json({ success: true, message: "更新成功" });
  } catch (error) {
    console.error("Admin update repair error:", error);
    return c.json({ success: false, message: "更新失败" }, 500);
  }
});

// 管理员登录接口
app.post("/api/admin/login", async (c) => {
  const db = c.env.DB;

  try {
    const body = await c.req.json();
    const { username, password } = body;

    // 输入验证
    if (!username || username.trim().length < 3) {
      return c.json({ success: false, message: "请输入正确的用户名" }, 422);
    }

    if (!password || password.length < 6) {
      return c.json({ success: false, message: "请输入密码" }, 422);
    }

    // 查询管理员
    const admin = await db
      .prepare("SELECT * FROM admins WHERE username = ?")
      .bind(username.trim())
      .first();

    if (!admin) {
      return c.json({ success: false, message: "用户名或密码错误" }, 401);
    }

    // 验证密码
    const isValidPassword = await verifyPassword(password, admin.password);

    if (!isValidPassword) {
      return c.json({ success: false, message: "用户名或密码错误" }, 401);
    }

    // 生成 Token（使用管理员 ID）
    const token = await generateToken(admin.id);

    return c.json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return c.json({ success: false, message: "登录失败，请稍后重试" }, 500);
  }
});

// 管理员：获取用户列表
app.get("/api/admin/users", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await verifyToken(token);
    const db = c.env.DB;

    // 检查是否为管理员
    const admin = await db
      .prepare("SELECT id FROM admins WHERE id = ?")
      .bind(decoded.userId)
      .first();

    if (!admin) {
      return c.json({ success: false, message: "无权访问" }, 403);
    }

    const users = await db
      .prepare(
        "SELECT id, name, phone, created_at FROM users ORDER BY created_at DESC",
      )
      .all();

    return c.json({ success: true, users: users.results || [] });
  } catch (error) {
    console.error("Admin get users error:", error);
    return c.json({ success: false, message: "获取用户列表失败" }, 500);
  }
});

// 管理员：删除用户
app.delete("/api/admin/users/:id", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];
  const userId = c.req.param("id");

  try {
    const decoded = await verifyToken(token);
    const db = c.env.DB;

    // 检查是否为管理员
    const admin = await db
      .prepare("SELECT id FROM admins WHERE id = ?")
      .bind(decoded.userId)
      .first();

    if (!admin) {
      return c.json({ success: false, message: "无权访问" }, 403);
    }

    // 删除用户（关联数据会自动级联删除）
    await db.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();

    return c.json({ success: true, message: "删除成功" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return c.json({ success: false, message: "删除失败" }, 500);
  }
});

// 管理员：添加新闻
app.post("/api/admin/news", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await verifyToken(token);
    const db = c.env.DB;
    const body = await c.req.json();

    // 检查是否为管理员
    const admin = await db
      .prepare("SELECT id FROM admins WHERE id = ?")
      .bind(decoded.userId)
      .first();

    if (!admin) {
      return c.json({ success: false, message: "无权访问" }, 403);
    }

    // 输入验证
    if (!body.title || body.title.trim().length < 5) {
      return c.json({ success: false, message: "标题至少需要5个字符" }, 422);
    }

    if (!body.content || body.content.trim().length < 10) {
      return c.json({ success: false, message: "内容至少需要10个字符" }, 422);
    }

    // 添加新闻
    await db
      .prepare("INSERT INTO news (title, content, author_id) VALUES (?, ?, ?)")
      .bind(
        sanitizeInput(body.title.trim()),
        sanitizeInput(body.content.trim()),
        decoded.userId,
      )
      .run();

    return c.json({ success: true, message: "添加成功" });
  } catch (error) {
    console.error("Admin add news error:", error);
    return c.json({ success: false, message: "添加失败" }, 500);
  }
});

// 管理员：删除新闻
app.delete("/api/admin/news/:id", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];
  const newsId = c.req.param("id");

  try {
    const decoded = await verifyToken(token);
    const db = c.env.DB;

    // 检查是否为管理员
    const admin = await db
      .prepare("SELECT id FROM admins WHERE id = ?")
      .bind(decoded.userId)
      .first();

    if (!admin) {
      return c.json({ success: false, message: "无权访问" }, 403);
    }

    // 删除新闻
    await db.prepare("DELETE FROM news WHERE id = ?").bind(newsId).run();

    return c.json({ success: true, message: "删除成功" });
  } catch (error) {
    console.error("Admin delete news error:", error);
    return c.json({ success: false, message: "删除失败" }, 500);
  }
});

// 管理员：获取统计数据
app.get("/api/admin/stats", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, message: "未授权" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await verifyToken(token);
    const db = c.env.DB;

    // 检查是否为管理员
    const admin = await db
      .prepare("SELECT id FROM admins WHERE id = ?")
      .bind(decoded.userId)
      .first();

    if (!admin) {
      return c.json({ success: false, message: "无权访问" }, 403);
    }

    // 获取统计数据
    const totalRepairs = await db
      .prepare("SELECT COUNT(*) as count FROM repairs")
      .first();
    const completedRepairs = await db
      .prepare(
        "SELECT COUNT(*) as count FROM repairs WHERE status = 'completed'",
      )
      .first();
    const pendingRepairs = await db
      .prepare("SELECT COUNT(*) as count FROM repairs WHERE status = 'pending'")
      .first();
    const processingRepairs = await db
      .prepare(
        "SELECT COUNT(*) as count FROM repairs WHERE status = 'processing'",
      )
      .first();
    const totalUsers = await db
      .prepare("SELECT COUNT(*) as count FROM users")
      .first();

    const completionRate =
      totalRepairs.count > 0
        ? Math.round((completedRepairs.count / totalRepairs.count) * 100)
        : 0;

    return c.json({
      success: true,
      stats: {
        totalRepairs: totalRepairs.count,
        completedRepairs: completedRepairs.count,
        pendingRepairs: pendingRepairs.count,
        processingRepairs: processingRepairs.count,
        totalUsers: totalUsers.count,
        completionRate,
      },
    });
  } catch (error) {
    console.error("Admin get stats error:", error);
    return c.json({ success: false, message: "获取统计数据失败" }, 500);
  }
});

export default app;
