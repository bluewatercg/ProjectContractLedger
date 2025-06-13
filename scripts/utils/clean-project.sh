#!/bin/bash

echo "清理项目依赖和构建文件"
echo "========================"

echo ""
echo "正在清理以下内容："
echo "- 根目录 node_modules"
echo "- 根目录 yarn.lock"
echo "- 后端 node_modules 和 yarn.lock"
echo "- 前端 node_modules 和 yarn.lock"
echo "- 后端 dist 目录"
echo "- 前端 dist 目录"

echo ""
read -p "确认清理？(y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "取消清理操作"
    exit 0
fi

echo ""
echo "开始清理..."

# 清理根目录
if [ -d "node_modules" ]; then
    echo "删除根目录 node_modules..."
    rm -rf "node_modules"
fi

if [ -f "yarn.lock" ]; then
    echo "删除根目录 yarn.lock..."
    rm -f "yarn.lock"
fi

# 清理后端
if [ -d "apps/backend/node_modules" ]; then
    echo "删除后端 node_modules..."
    rm -rf "apps/backend/node_modules"
fi

if [ -f "apps/backend/yarn.lock" ]; then
    echo "删除后端 yarn.lock..."
    rm -f "apps/backend/yarn.lock"
fi

if [ -d "apps/backend/dist" ]; then
    echo "删除后端 dist..."
    rm -rf "apps/backend/dist"
fi

# 清理前端
if [ -d "apps/frontend/node_modules" ]; then
    echo "删除前端 node_modules..."
    rm -rf "apps/frontend/node_modules"
fi

if [ -f "apps/frontend/yarn.lock" ]; then
    echo "删除前端 yarn.lock..."
    rm -f "apps/frontend/yarn.lock"
fi

if [ -d "apps/frontend/dist" ]; then
    echo "删除前端 dist..."
    rm -rf "apps/frontend/dist"
fi

echo ""
echo "✅ 清理完成！"
echo ""
echo "现在可以运行以下命令重新安装依赖："
echo "  yarn install-all"
echo ""
