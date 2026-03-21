@echo off
chcp 65001 >nul
echo ========================================
echo 城市公共服务平台 - 后端部署脚本
echo ========================================
echo.

cd /d "%~dp0backend\cloudflare-worker"

echo [1/5] 检查依赖...
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo 依赖安装失败！
        pause
        exit /b 1
    )
) else (
    echo 依赖已存在，跳过安装
)
echo.

echo [2/5] 检查 Cloudflare 登录状态...
call npx wrangler whoami 2>nul
if errorlevel 1 (
    echo 请先登录 Cloudflare...
    call npx wrangler login
    if errorlevel 1 (
        echo 登录失败！
        pause
        exit /b 1
    )
) else (
    echo 已登录
)
echo.

echo [3/5] 检查数据库配置...
findstr /C:"your-database-id-here" wrangler.toml >nul
if not errorlevel 1 (
    echo 警告：数据库 ID 未配置！
    echo.
    echo 请选择：
    echo 1. 创建新数据库
    echo 2. 手动配置数据库 ID
    echo.
    set /p choice="请输入选项 (1/2): "
    
    if "%choice%"=="1" (
        echo 正在创建数据库...
        call npx wrangler d1 create city-service-db
        echo.
        echo 请复制上面的 database_id 到 wrangler.toml 中
        echo 然后重新运行此脚本
        pause
        exit /b 0
    ) else if "%choice%"=="2" (
        echo 请打开 wrangler.toml 文件
        echo 将 database_id 设置为您的实际数据库 ID
        pause
        exit /b 0
    )
) else (
    echo 数据库已配置
)
echo.

echo [4/5] 初始化数据库...
call npx wrangler d1 execute city-service-db --file=./schema.sql
if errorlevel 1 (
    echo 数据库初始化失败！
    pause
    exit /b 1
)
echo.

echo [5/5] 部署后端...
call npx wrangler deploy
if errorlevel 1 (
    echo 部署失败！
    pause
    exit /b 1
)
echo.

echo ========================================
echo 部署成功！
echo ========================================
echo.
echo 后端地址：https://city-public-service-platfom.2213499332.workers.dev
echo 健康检查：https://city-public-service-platfom.2213499332.workers.dev/api/health
echo.
echo 请测试健康检查接口是否正常
pause
