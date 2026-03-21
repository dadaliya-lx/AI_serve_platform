import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';
import jwtLib from 'jsonwebtoken';

const app = new Hono();

app.use('/*', cors({
  origin: '*',
  credentials: true,
}));

const JWT_SECRET = 'your-jwt-secret-key-change-in-production';

// 生成 JWT Token
function generateToken(userId) {
  return jwtLib.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}

// 生成唯一报修ID（使用随机字符串避免并发冲突）
function generateRepairId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `R${timestamp}${random}`;
}

// 验证手机号格式
function validatePhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// 验证密码强度
function validatePassword(password) {
  return password && password.length >= 6;
}

// 清理输入防止 XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// 注册接口
app.post('/api/register', async (c) => {
  const db = c.env.DB;
  
  try {
    const body = await c.req.json();
    const { name, phone, password } = body;
    
    // 输入验证
    if (!name || name.trim().length < 2) {
      return c.json({ success: false, message: '姓名至少需要2个字符' }, 422);
    }
    
    if (!validatePhone(phone)) {
      return c.json({ success: false, message: '请输入正确的手机号' }, 422);
    }
    
    if (!validatePassword(password)) {
      return c.json({ success: false, message: '密码至少需要6个字符' }, 422);
    }
    
    // 检查手机号是否已注册
    const existingUser = await db.prepare('SELECT id FROM users WHERE phone = ?').bind(phone).first();
    
    if (existingUser) {
      return c.json({ success: false, message: '该手机号已注册' }, 409);
    }
    
    // 清理输入
    const safeName = sanitizeInput(name.trim());
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 插入用户
    const result = await db.prepare('INSERT INTO users (name, phone, password) VALUES (?, ?, ?)')
      .bind(safeName, phone, hashedPassword)
      .run();
    
    return c.json({ success: true, message: '注册成功', userId: result.meta.last_row_id });
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ success: false, message: '注册失败，请稍后重试' }, 500);
  }
});

// 登录接口
app.post('/api/login', async (c) => {
  const db = c.env.DB;
  
  try {
    const body = await c.req.json();
    const { phone, password } = body;
    
    // 输入验证
    if (!validatePhone(phone)) {
      return c.json({ success: false, message: '请输入正确的手机号' }, 422);
    }
    
    if (!password) {
      return c.json({ success: false, message: '请输入密码' }, 422);
    }
    
    // 查询用户
    const user = await db.prepare('SELECT * FROM users WHERE phone = ?').bind(phone).first();
    
    if (!user) {
      return c.json({ success: false, message: '手机号或密码错误' }, 401);
    }
    
    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return c.json({ success: false, message: '手机号或密码错误' }, 401);
    }
    
    // 生成 Token
    const token = generateToken(user.id);
    
    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, message: '登录失败，请稍后重试' }, 500);
  }
});

// 获取用户信息
app.get('/api/user/profile', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未授权' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwtLib.verify(token, JWT_SECRET);
    const db = c.env.DB;
    
    const user = await db.prepare('SELECT id, name, phone, avatar, created_at FROM users WHERE id = ?')
      .bind(decoded.userId)
      .first();
    
    if (!user) {
      return c.json({ success: false, message: '用户不存在' }, 404);
    }
    
    return c.json({ success: true, user });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return c.json({ success: false, message: '登录已过期，请重新登录' }, 401);
    }
    console.error('Get profile error:', error);
    return c.json({ success: false, message: '获取用户信息失败' }, 500);
  }
});

// 更新用户信息
app.put('/api/user/profile', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未授权' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwtLib.verify(token, JWT_SECRET);
    const db = c.env.DB;
    const body = await c.req.json();
    
    // 验证输入
    if (body.name && body.name.trim().length < 2) {
      return c.json({ success: false, message: '姓名至少需要2个字符' }, 422);
    }
    
    // 清理输入
    const updates = {};
    if (body.name) updates.name = sanitizeInput(body.name.trim());
    if (body.avatar) updates.avatar = sanitizeInput(body.avatar.trim());
    
    if (Object.keys(updates).length === 0) {
      return c.json({ success: false, message: '没有要更新的内容' }, 422);
    }
    
    // 构建更新 SQL
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    await db.prepare(`UPDATE users SET ${fields} WHERE id = ?`)
      .bind(...values, decoded.userId)
      .run();
    
    return c.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ success: false, message: '更新失败' }, 500);
  }
});

// 提交报修
app.post('/api/repairs', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未授权' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwtLib.verify(token, JWT_SECRET);
    const db = c.env.DB;
    const body = await c.req.json();
    
    // 验证必填项
    if (!body.facility_type) {
      return c.json({ success: false, message: '请选择设施类型' }, 422);
    }
    
    if (!body.damage_type) {
      return c.json({ success: false, message: '请选择损坏类型' }, 422);
    }
    
    if (!body.location || body.location.trim().length < 5) {
      return c.json({ success: false, message: '请输入详细的位置信息（至少5个字符）' }, 422);
    }
    
    if (!body.description || body.description.trim().length < 10) {
      return c.json({ success: false, message: '请详细描述问题（至少10个字符）' }, 422);
    }
    
    // 生成唯一报修ID
    const repairId = generateRepairId();
    
    // 清理输入
    const safeFacilityType = sanitizeInput(body.facility_type);
    const safeDamageType = sanitizeInput(body.damage_type);
    const safeLocation = sanitizeInput(body.location.trim());
    const safeDescription = sanitizeInput(body.description.trim());
    const safeImage = body.image ? sanitizeInput(body.image) : null;
    
    // 插入报修记录
    await db.prepare(`
      INSERT INTO repairs (repair_id, user_id, facility_type, damage_type, location, description, image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(repairId, decoded.userId, safeFacilityType, safeDamageType, safeLocation, safeDescription, safeImage)
      .run();
    
    return c.json({ success: true, repair_id: repairId, message: '报修提交成功' });
  } catch (error) {
    console.error('Submit repair error:', error);
    return c.json({ success: false, message: '提交失败，请稍后重试' }, 500);
  }
});

// 获取报修列表
app.get('/api/repairs', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未授权' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwtLib.verify(token, JWT_SECRET);
    const db = c.env.DB;
    
    const repairs = await db.prepare(`
      SELECT repair_id, facility_type, damage_type, location, status, progress, submit_time, update_time 
      FROM repairs 
      WHERE user_id = ? 
      ORDER BY submit_time DESC
    `).bind(decoded.userId).all();
    
    return c.json({ success: true, repairs: repairs.results || [] });
  } catch (error) {
    console.error('Get repairs error:', error);
    return c.json({ success: false, message: '获取报修列表失败' }, 500);
  }
});

// 获取报修详情
app.get('/api/repairs/:repair_id', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未授权' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  const repairId = c.req.param('repair_id');
  
  try {
    const decoded = jwtLib.verify(token, JWT_SECRET);
    const db = c.env.DB;
    
    const repair = await db.prepare(`
      SELECT * FROM repairs 
      WHERE repair_id = ? AND user_id = ?
    `).bind(repairId, decoded.userId).first();
    
    if (!repair) {
      return c.json({ success: false, message: '未找到该报修记录' }, 404);
    }
    
    return c.json({ success: true, repair });
  } catch (error) {
    console.error('Get repair detail error:', error);
    return c.json({ success: false, message: '获取报修详情失败' }, 500);
  }
});

// 删除报修
app.delete('/api/repairs/:repair_id', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未授权' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  const repairId = c.req.param('repair_id');
  
  try {
    const decoded = jwtLib.verify(token, JWT_SECRET);
    const db = c.env.DB;
    
    // 先检查记录是否存在且属于当前用户
    const repair = await db.prepare('SELECT id FROM repairs WHERE repair_id = ? AND user_id = ?')
      .bind(repairId, decoded.userId).first();
    
    if (!repair) {
      return c.json({ success: false, message: '未找到该报修记录或无权删除' }, 404);
    }
    
    await db.prepare('DELETE FROM repairs WHERE repair_id = ? AND user_id = ?')
      .bind(repairId, decoded.userId).run();
    
    return c.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete repair error:', error);
    return c.json({ success: false, message: '删除失败' }, 500);
  }
});

// 获取通知列表
app.get('/api/notifications', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未授权' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwtLib.verify(token, JWT_SECRET);
    const db = c.env.DB;
    
    const notifications = await db.prepare(`
      SELECT id, title, content, is_read, created_at 
      FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(decoded.userId).all();
    
    return c.json({ success: true, notifications: notifications.results || [] });
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ success: false, message: '获取通知失败' }, 500);
  }
});

// 标记通知为已读
app.put('/api/notifications/:id/read', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未授权' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  const notificationId = c.req.param('id');
  
  try {
    const decoded = jwtLib.verify(token, JWT_SECRET);
    const db = c.env.DB;
    
    await db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
      .bind(notificationId, decoded.userId).run();
    
    return c.json({ success: true, message: '标记已读成功' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return c.json({ success: false, message: '标记失败' }, 500);
  }
});

// 获取未读通知数量
app.get('/api/notifications/unread-count', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未授权' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwtLib.verify(token, JWT_SECRET);
    const db = c.env.DB;
    
    const result = await db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0')
      .bind(decoded.userId).first();
    
    return c.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Get unread count error:', error);
    return c.json({ success: false, message: '获取未读数量失败' }, 500);
  }
});

// 获取新闻列表
app.get('/api/news', async (c) => {
  try {
    const db = c.env.DB;
    
    const news = await db.prepare(`
      SELECT id, title, content, publish_date 
      FROM news 
      ORDER BY publish_date DESC
    `).all();
    
    return c.json({ success: true, news: news.results || [] });
  } catch (error) {
    console.error('Get news error:', error);
    return c.json({ success: false, message: '获取新闻失败' }, 500);
  }
});

// 管理员：获取所有报修
app.get('/api/admin/repairs', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未授权' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwtLib.verify(token, JWT_SECRET);
    const db = c.env.DB;
    
    // 检查是否为管理员
    const admin = await db.prepare('SELECT id FROM admins WHERE id = ?')
      .bind(decoded.userId).first();
    
    if (!admin) {
      return c.json({ success: false, message: '无权访问' }, 403);
    }
    
    const repairs = await db.prepare(`
      SELECT r.*, u.name as user_name, u.phone as user_phone
      FROM repairs r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.submit_time DESC
    `).all();
    
    return c.json({ success: true, repairs: repairs.results || [] });
  } catch (error) {
    console.error('Admin get repairs error:', error);
    return c.json({ success: false, message: '获取报修列表失败' }, 500);
  }
});

// 管理员：更新报修状态
app.put('/api/admin/repairs/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未授权' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  const repairId = c.req.param('id');
  
  try {
    const decoded = jwtLib.verify(token, JWT_SECRET);
    const db = c.env.DB;
    const body = await c.req.json();
    
    // 检查是否为管理员
    const admin = await db.prepare('SELECT id FROM admins WHERE id = ?')
      .bind(decoded.userId).first();
    
    if (!admin) {
      return c.json({ success: false, message: '无权访问' }, 403);
    }
    
    // 验证状态值
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (body.status && !validStatuses.includes(body.status)) {
      return c.json({ success: false, message: '无效的状态值' }, 422);
    }
    
    // 验证进度值
    if (body.progress !== undefined && (body.progress < 0 || body.progress > 100)) {
      return c.json({ success: false, message: '进度值必须在0-100之间' }, 422);
    }
    
    // 构建更新字段
    const updates = [];
    const values = [];
    
    if (body.status) {
      updates.push('status = ?');
      values.push(body.status);
    }
    
    if (body.progress !== undefined) {
      updates.push('progress = ?');
      values.push(body.progress);
    }
    
    if (body.admin_note !== undefined) {
      updates.push('admin_note = ?');
      values.push(sanitizeInput(body.admin_note));
    }
    
    if (updates.length === 0) {
      return c.json({ success: false, message: '没有要更新的内容' }, 422);
    }
    
    updates.push('update_time = CURRENT_TIMESTAMP');
    values.push(repairId);
    
    await db.prepare(`UPDATE repairs SET ${updates.join(', ')} WHERE repair_id = ?`)
      .bind(...values).run();
    
    return c.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('Admin update repair error:', error);
    return c.json({ success: false, message: '更新失败' }, 500);
  }
});

// 健康检查接口
app.get('/api/health', async (c) => {
  return c.json({ success: true, message: '服务正常运行', timestamp: new Date().toISOString() });
});

export default app;
