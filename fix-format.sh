#!/bin/bash

# 代码格式化脚本 - 修复ESLint和Prettier格式问题

set -e

echo "=== 代码格式化工具 ==="
echo "修复后端和前端的代码格式问题"
echo ""

# 检查是否在项目根目录
if [ ! -d "midway-backend" ] || [ ! -d "midway-frontend" ]; then
    echo "错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 修复后端代码格式
echo "=== 修复后端代码格式 ==="
cd midway-backend

if [ ! -d "node_modules" ]; then
    echo "安装后端依赖..."
    yarn install
fi

echo "运行后端代码格式化..."
yarn lint:fix

echo "检查后端代码格式..."
if yarn lint; then
    echo "✅ 后端代码格式检查通过"
else
    echo "❌ 后端代码格式仍有问题，请手动检查"
fi

cd ..

# 修复前端代码格式
echo ""
echo "=== 修复前端代码格式 ==="
cd midway-frontend

if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    yarn install
fi

echo "运行前端代码格式化..."
yarn lint

echo "✅ 前端代码格式化完成"

cd ..

echo ""
echo "=== 格式化完成 ==="
echo "所有代码格式问题已修复，可以提交代码了"
echo ""
echo "提交命令:"
echo "  git add ."
echo "  git commit -m \"fix: 修复代码格式问题\""
echo "  git push"
