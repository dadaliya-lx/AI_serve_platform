@echo off
chcp 65001 >nul
title 后端服务器启动脚本
color 0A

echo ========================================
echo   后端服务器启动脚本
echo ========================================
echo.

:: 检查 Node.js
echo [1/3] 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Node.js 未安装或未添加到环境变量
    echo 请先安装 Node.js 并配置环境变量
    pause
    exit /b 1
)
echo [OK] Node.js 已安装

:: 进入后端目录
echo [2/3] 进入后端目录...
cd /d "%~dp0backend\cloudflare-worker"
if %errorlevel% neq 0 (
    echo [错误] 无法进入后端目录
    pause
    exit /b 1
)
echo [OK] 已进入后端目录

:: 启动后端服务器
echo [3/3] 启动后端服务器...
echo 正在启动后端服务器...
echo 服务器地址: http://127.0.0.1:3000
echo 健康检查: http://127.0.0.1:3000/api/health
echo 注册接口: http://127.0.0.1:3000/api/register
echo 登录接口: http://127.0.0.1:3000/api/login
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

:: 启动服务器
node real-server.js

pause