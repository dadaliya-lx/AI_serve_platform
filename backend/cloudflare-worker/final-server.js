const http = require("http");

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] 收到请求: ${req.method} ${req.url}`);
  
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === "/api/health" || req.url === "/") {
    const response = {
      success: true,
      message: "服务正常运行",
      timestamp: new Date().toISOString(),
      server: "本地测试服务器",
    };
    console.log("响应:", response);
    res.end(JSON.stringify(response, null, 2));
  } else if (req.url === "/api/register" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk.toString());
    req.on("end", () => {
      console.log("注册请求体:", body);
      try {
        const data = JSON.parse(body);
        console.log("解析后的数据:", data);
        
        if (!data.name || !data.phone || !data.password) {
          const error = { success: false, message: "请填写完整的注册信息" };
          console.log("错误响应:", error);
          res.end(JSON.stringify(error, null, 2));
          return;
        }
        
        const response = {
          success: true,
          message: "注册成功（本地测试）",
          user: {
            id: Date.now().toString(),
            name: data.name,
            phone: data.phone,
            created_at: new Date().toISOString(),
          },
        };
        console.log("成功响应:", response);
        res.end(JSON.stringify(response, null, 2));
      } catch (error) {
        console.error("解析错误:", error);
        const errorResponse = {
          success: false,
          message: "数据格式错误: " + error.message,
        };
        res.end(JSON.stringify(errorResponse, null, 2));
      }
    });
  } else if (req.url === "/api/login" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk.toString());
    req.on("end", () => {
      console.log("登录请求体:", body);
      try {
        const data = JSON.parse(body);
        console.log("解析后的数据:", data);
        
        const response = {
          success: true,
          message: "登录成功（本地测试）",
          token: "test-token-" + Date.now(),
          user: {
            id: "123",
            name: "测试用户",
            phone: data.phone,
            created_at: new Date().toISOString(),
          },
        };
        console.log("成功响应:", response);
        res.end(JSON.stringify(response, null, 2));
      } catch (error) {
        console.error("解析错误:", error);
        const errorResponse = {
          success: false,
          message: "数据格式错误: " + error.message,
        };
        res.end(JSON.stringify(errorResponse, null, 2));
      }
    });
  } else {
    const notFound = {
      success: false,
      message: "接口不存在",
      url: req.url,
      method: req.method,
    };
    console.log("404响应:", notFound);
    res.end(JSON.stringify(notFound, null, 2));
  }
});

const PORT = 3000;
server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n========================================`);
  console.log(`✅ 本地后端服务器启动成功！`);
  console.log(`========================================`);
  console.log(`📍 后端地址: http://127.0.0.1:${PORT}`);
  console.log(`🧪 健康检查: http://127.0.0.1:${PORT}/api/health`);
  console.log(`📝 注册接口: http://127.0.0.1:${PORT}/api/register`);
  console.log(`🔐 登录接口: http://127.0.0.1:${PORT}/api/login`);
  console.log(`========================================\n`);
});

server.on("error", (error) => {
  console.error("服务器错误:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`端口 ${PORT} 已被占用，请检查是否有其他程序在使用该端口`);
  }
});