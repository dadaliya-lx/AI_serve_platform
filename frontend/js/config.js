// 配置文件 - 用于本地开发和生产环境切换

// 开发模式：设置为 true 使用本地后端，设置为 false 使用生产环境后端
const IS_DEV_MODE = false;

// 本地后端地址
const LOCAL_API_BASE_URL = "http://127.0.0.1:3000/api";

// 生产环境后端地址
const PROD_API_BASE_URL =
  "https://city-public-service-platfom.2213499332.workers.dev/api";

// 根据模式选择 API 地址
const API_BASE_URL = IS_DEV_MODE ? LOCAL_API_BASE_URL : PROD_API_BASE_URL;

// 导出配置
window.APP_CONFIG = {
  IS_DEV_MODE,
  API_BASE_URL,
  LOCAL_API_BASE_URL,
  PROD_API_BASE_URL,
};

console.log(`当前模式: ${IS_DEV_MODE ? "本地开发" : "生产环境"}`);
console.log(`API 地址: ${API_BASE_URL}`);
