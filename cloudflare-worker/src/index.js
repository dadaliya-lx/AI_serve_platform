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

function generateToken(userId) {
  return jwtLib.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}

function generateRepairId() {
  return 'R' + Date.now().toString(36).toUpperCase();
}

app.post('/api/register', async (c) => {
  const db = c.env.DB;
  const { name, phone, password } = await c.req.json();

  try {
    const existingUser = await db.prepare('SELECT * FROM users WHERE phone = ?').bind(phone).first();
    
    if (existingUser) {
      return c.json({ success: false, message: '该手机号已注册' }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.prepare('INSERT INTO users (name, phone, password) VALUES (?, ?, ?)')
      .bind(name, phone, hashedPassword)
      .run();

    return c.json({ success: true, message: '注册成功' });
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ success: false, message: '注册失败' }, 500);
  }
});

app.post('/api/login', async (c) => {
  const db = c.env.DB;
  const { phone, password } = await c.req.json();

  try {
    const user = await db.prepare('SELECT * FROM users WHERE phone = ?').bind(phone).first();

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return c.json({ success: false, message: '手机号或密码错误' }, 401);
    }

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
    return c.json({ success: false, message: '登录失败' }, 500);
  }
});

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
    return c.json({ success: false, message: '无效的token' }, 401);
  }
});

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

    const repairId = generateRepairId();

    await db.prepare(`
      INSERT INTO repairs (repair_id, user_id, facility_type, damage_type, location, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(repairId, decoded.userId, body.facility_type, body.damage_type, body.location, body.description)
      .run();

    return c.json({ success: true, repair_id: repairId });
  } catch (error) {
    console.error('Submit repair error:', error);
    return c.json({ success: false, message: '提交失败' }, 500);
  }
});

app.get('/api/repairs', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json([]);
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwtLib.verify(token, JWT_SECRET);
    const db = c.env.DB;

    const repairs = await db.prepare('SELECT * FROM repairs WHERE user_id = ? ORDER BY submit_time DESC')
      .bind(decoded.userId)
      .all();

    return c.json(repairs.results || []);
  } catch (error) {
    console.error('Get repairs error:', error);
    return c.json([]);
  }
});

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

    const repair = await db.prepare('SELECT * FROM repairs WHERE repair_id = ? AND user_id = ?')
      .bind(repairId, decoded.userId)
      .first();

    if (!repair) {
      return c.json({ success: false, message: '未找到该报修记录' }, 404);
    }

    return c.json(repair);
  } catch (error) {
    console.error('Get repair detail error:', error);
    return c.json({ success: false, message: '获取失败' }, 500);
  }
});

app.get('/api/notifications', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json([]);
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwtLib.verify(token, JWT_SECRET);
    const db = c.env.DB;

    const notifications = await db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC')
      .bind(decoded.userId)
      .all();

    return c.json(notifications.results || []);
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json([]);
  }
});

app.get('/api/news', async (c) => {
  const db = c.env.DB;

  try {
    const news = await db.prepare('SELECT * FROM news ORDER BY publish_date DESC').all();
    return c.json(news.results || []);
  } catch (error) {
    console.error('Get news error:', error);
    return c.json([]);
  }
});

export default app;
