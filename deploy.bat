@echo off
echo ========================================
echo 城市公共设施服务平台 - 部署助手
echo ========================================
echo.
echo 请按照以下步骤操作：
echo.
echo 1. 在 GitHub 创建一个新仓库
echo 2. 复制仓库地址（例如：https://github.com/用户名/仓库名.git）
echo.
set /p repo_url="请输入你的 GitHub 仓库地址: "

echo.
echo 正在初始化 Git 仓库...
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin %repo_url%
git push -u origin main

echo.
echo ========================================
echo 代码已推送到 GitHub！
echo ========================================
echo.
echo 接下来请按照 SIMPLE_DEPLOY.md 文件中的步骤操作：
echo.
echo 1. 访问 https://render.com 部署后端
echo 2. 访问 https://dash.cloudflare.com 部署前端
echo.
pause
