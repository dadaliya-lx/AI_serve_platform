// Cloudflare Worker - ES Module 格式
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // 设置 CORS 头
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    };

    // 处理 OPTIONS 请求
    if (method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // 健康检查接口
    if (pathname === "/api/health" && method === "GET") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "服务正常运行",
          timestamp: new Date().toISOString(),
        }),
        { headers },
      );
    }

    // 根路径
    if (pathname === "/" && method === "GET") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "API 服务正常运行",
          endpoints: [
            "GET /api/health - 健康检查",
            "POST /api/register - 用户注册",
            "POST /api/login - 用户登录",
          ],
        }),
        { headers },
      );
    }

    // 注册接口
    if (pathname === "/api/register" && method === "POST") {
      try {
        const body = await request.json();
        const { name, phone, password } = body;

        // 输入验证
        if (!name || name.trim().length < 2) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "姓名至少需要2个字符",
            }),
            { status: 422, headers },
          );
        }

        if (!/^1[3-9]\d{9}$/.test(phone)) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "请输入正确的手机号",
            }),
            { status: 422, headers },
          );
        }

        if (!password || password.length < 6) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "密码至少需要6个字符",
            }),
            { status: 422, headers },
          );
        }

        // 模拟注册成功
        return new Response(
          JSON.stringify({
            success: true,
            message: "注册成功",
          }),
          { headers },
        );
      } catch (error) {
        console.error("Register error:", error);
        return new Response(
          JSON.stringify({
            success: false,
            message: "注册失败，请稍后重试",
          }),
          { status: 500, headers },
        );
      }
    }

    // 登录接口
    if (pathname === "/api/login" && method === "POST") {
      try {
        const body = await request.json();
        const { phone, password } = body;

        // 输入验证
        if (!/^1[3-9]\d{9}$/.test(phone)) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "请输入正确的手机号",
            }),
            { status: 422, headers },
          );
        }

        if (!password) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "请输入密码",
            }),
            { status: 422, headers },
          );
        }

        // 模拟登录成功
        return new Response(
          JSON.stringify({
            success: true,
            message: "登录成功",
            token: "test-token-" + Date.now(),
            user: {
              id: "123",
              name: "测试用户",
              phone: phone,
            },
          }),
          { headers },
        );
      } catch (error) {
        console.error("Login error:", error);
        return new Response(
          JSON.stringify({
            success: false,
            message: "登录失败，请稍后重试",
          }),
          { status: 500, headers },
        );
      }
    }

    // 404 处理
    return new Response(
      JSON.stringify({
        success: false,
        message: "接口不存在",
      }),
      { status: 404, headers },
    );
  },
};
