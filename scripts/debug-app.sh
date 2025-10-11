#!/bin/bash

# Electron 应用调试脚本
# 用于从命令行运行打包后的应用，查看详细的错误信息

set -e

echo "🔍 查找打包的应用..."

# 查找 .app 文件
APP_PATH=$(find release -name "*.app" -type d | head -1)

if [ -z "$APP_PATH" ]; then
    echo "❌ 未找到打包的 .app 文件"
    echo "请先运行: pnpm dist:mac"
    exit 1
fi

echo "✅ 找到应用: $APP_PATH"
echo ""

# 检查应用结构
echo "📦 应用结构:"
echo "Contents/MacOS:"
ls -lh "$APP_PATH/Contents/MacOS/" 2>/dev/null || echo "  (目录不存在)"
echo ""
echo "Contents/Resources/app:"
ls -lh "$APP_PATH/Contents/Resources/app/" 2>/dev/null || echo "  (目录不存在)"
echo ""

# 检查关键文件
echo "🔍 检查关键文件:"
RESOURCES_PATH="$APP_PATH/Contents/Resources/app"

if [ -d "$RESOURCES_PATH" ]; then
    echo "  ✓ Resources/app 目录存在"
    
    if [ -f "$RESOURCES_PATH/dist/electron/main.js" ]; then
        echo "  ✓ main.js 存在"
    else
        echo "  ✗ main.js 不存在"
    fi
    
    if [ -f "$RESOURCES_PATH/dist/server/server.js" ]; then
        echo "  ✓ server.js 存在"
    else
        echo "  ✗ server.js 不存在"
    fi
    
    if [ -d "$RESOURCES_PATH/node_modules" ]; then
        echo "  ✓ node_modules 存在"
    else
        echo "  ✗ node_modules 不存在"
    fi
else
    echo "  ✗ Resources/app 目录不存在"
fi

echo ""
echo "🚀 启动应用（按 Ctrl+C 退出）..."
echo "================================================"
echo ""

# 设置环境变量以获取更多调试信息
export ELECTRON_ENABLE_LOGGING=1
export ELECTRON_ENABLE_STACK_DUMPING=1

# 运行应用
"$APP_PATH/Contents/MacOS/Haibara Tools" 2>&1

echo ""
echo "================================================"
echo "应用已退出"

