-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 报修记录表
CREATE TABLE IF NOT EXISTS repairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repair_id TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    facility_type TEXT,
    damage_type TEXT,
    location TEXT,
    description TEXT,
    image TEXT,
    status TEXT DEFAULT 'pending',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    admin_note TEXT,
    submit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    is_read INTEGER DEFAULT 0 CHECK (is_read IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 新闻表
CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    publish_date DATE DEFAULT CURRENT_DATE
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_repairs_user_id ON repairs(user_id);
CREATE INDEX IF NOT EXISTS idx_repairs_repair_id ON repairs(repair_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
CREATE INDEX IF NOT EXISTS idx_repairs_submit_time ON repairs(submit_time DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 插入默认管理员账号
-- 密码: admin123 (使用 bcrypt 加密)
INSERT OR IGNORE INTO admins (username, password, name) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.eG5HdFqJlJlKjOqKze', '管理员');

-- 插入示例新闻数据
INSERT OR IGNORE INTO news (title, content, publish_date) VALUES 
('平台正式上线', '城市公共设施服务平台正式上线，欢迎使用！', DATE('now')),
('报修流程优化', '我们优化了报修提交流程，现在更加便捷。', DATE('now'));
