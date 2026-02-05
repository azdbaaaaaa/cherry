#!/bin/bash

# 浏览器 MCP 服务安装脚本

set -e

echo "🚀 开始安装浏览器 MCP 服务..."

# 进入项目目录
cd "$(dirname "$0")"

# 1. 安装 npm 依赖
echo "📦 安装 npm 依赖包..."
npm install --save-dev @modelcontextprotocol/server-playwright playwright

# 2. 安装 Playwright 浏览器
echo "🌐 安装 Playwright Chromium 浏览器..."
npx playwright install chromium

# 3. 验证安装
echo "✅ 验证安装..."
if [ -f "node_modules/@modelcontextprotocol/server-playwright/dist/index.js" ]; then
    echo "✅ MCP Playwright 服务器已安装"
else
    echo "❌ MCP Playwright 服务器安装失败"
    exit 1
fi

if [ -d "$HOME/.cache/ms-playwright/chromium-*" ]; then
    echo "✅ Chromium 浏览器已安装"
else
    echo "⚠️  Chromium 浏览器可能未正确安装，请手动运行: npx playwright install chromium"
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "📝 下一步："
echo "1. 确保 ~/.cursor/mcp.json 已配置（已自动配置）"
echo "2. 重启 Cursor 编辑器"
echo "3. 我就可以开始使用浏览器调试功能了！"
echo ""

