const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 健康检查
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: '服务正常运行',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // 注册接口
  if (req.url === '/api/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('注册数据:', data);
        
        if (!data.name || !data.phone || !data.password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: '请填写完整的注册信息'
          }));
          return;
        }
        
        // 模拟注册成功
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: '注册成功',
          user: {
            id: Date.now().toString(),
            name: data.name,
            phone: data.phone,
            created_at: new Date().toISOString()
          }
        }));
      } catch (error) {
        console.error('注册错误:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: '数据格式错误'
        }));
      }
    });
    return;
  }
  
  // 登录接口
  if (req.url === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('登录数据:', data);
        
        if (!data.phone || !data.password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: '请填写完整的登录信息'
          }));
          return;
        }
        
        // 模拟登录成功
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: '登录成功',
          token: 'test-token-' + Date.now(),
          user: {
            id: '123',
            name: '测试用户',
            phone: data.phone,
            created_at: new Date().toISOString()
          }
        }));
      } catch (error) {
        console.error('登录错误:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: '数据格式错误'
        }));
      }
    });
    return;
  }
  
  // 404 处理
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    message: '接口不存在'
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`🚀 后端服务器启动成功！`);
  console.log(`========================================`);
  console.log(`📍 服务器地址: http://0.0.0.0:${PORT}`);
  console.log(`🧪 健康检查: http://127.0.0.1:${PORT}/api/health`);
  console.log(`📝 注册接口: http://127.0.0.1:${PORT}/api/register`);
  console.log(`🔐 登录接口: http://127.0.0.1:${PORT}/api/login`);
  console.log(`========================================`);
  console.log(`\n服务器正在运行...`);
  console.log(`按 Ctrl+C 停止服务器`);
});

// 错误处理
server.on('error', (error) => {
  console.error('服务器错误:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用`);
    console.error('请检查是否有其他程序在使用该端口');
  }
});