#!/bin/bash

# 测试Vite权限修复脚本

set -e

echo "=== Vite权限问题修复测试 ==="
echo "时间: $(date)"
echo ""

# 检查前端目录
echo "1. 检查前端构建环境..."

cd apps/frontend

# 检查vite可执行文件
echo "检查本地vite可执行文件:"
if [ -f "node_modules/.bin/vite" ]; then
    echo "✅ vite 可执行文件存在"
    ls -la node_modules/.bin/vite
    echo ""
    echo "文件权限:"
    stat node_modules/.bin/vite | grep Access || ls -la node_modules/.bin/vite
else
    echo "❌ vite 可执行文件不存在"
    echo "检查node_modules/.bin目录:"
    ls -la node_modules/.bin/ | grep vite || echo "未找到vite"
fi

echo ""

# 测试vite命令
echo "2. 测试vite命令..."

echo "测试直接调用vite:"
if ./node_modules/.bin/vite --version; then
    echo "✅ 直接调用vite成功"
else
    echo "❌ 直接调用vite失败"
    echo "尝试修复权限:"
    chmod +x node_modules/.bin/vite
    if ./node_modules/.bin/vite --version; then
        echo "✅ 修复权限后vite可用"
    else
        echo "❌ 修复权限后vite仍然失败"
    fi
fi

echo ""

echo "测试yarn调用vite:"
if yarn vite --version; then
    echo "✅ yarn调用vite成功"
else
    echo "❌ yarn调用vite失败"
fi

echo ""

# 检查package.json脚本
echo "3. 检查package.json构建脚本..."
echo "构建脚本配置:"
grep -A 5 -B 5 '"build"' package.json

echo ""

# 测试构建命令
echo "4. 测试构建命令..."

# 清理之前的构建
if [ -d "dist" ]; then
    echo "清理之前的构建产物..."
    rm -rf dist
fi

echo "测试yarn build:"
if yarn build; then
    echo "✅ yarn build 成功"
    if [ -f "dist/index.html" ]; then
        echo "✅ 构建产物正常"
        echo "构建大小: $(du -sh dist/)"
    else
        echo "❌ 构建产物不完整"
    fi
else
    echo "❌ yarn build 失败"
    echo ""
    echo "尝试直接使用vite build:"
    if NODE_ENV=production ./node_modules/.bin/vite build; then
        echo "✅ 直接vite build 成功"
        if [ -f "dist/index.html" ]; then
            echo "✅ 构建产物正常"
        else
            echo "❌ 构建产物不完整"
        fi
    else
        echo "❌ 直接vite build 也失败"
    fi
fi

echo ""

# 回到项目根目录
cd ../..

# 检查Dockerfile修复
echo "5. 检查Dockerfile修复..."

echo "权限修复配置:"
grep -A 3 -B 1 "chmod.*node_modules" tools/docker/Dockerfile

echo ""
echo "构建命令配置:"
grep -A 5 -B 2 "yarn build\|vite build" tools/docker/Dockerfile

echo ""

# 显示修复摘要
echo "=== 修复摘要 ==="
echo "问题: Docker构建时 'vite: Permission denied'"
echo "原因: Alpine Linux环境中node_modules/.bin/vite没有执行权限"
echo ""
echo "解决方案:"
echo "  1. 在依赖安装后添加权限修复: chmod -R +x node_modules/.bin/"
echo "  2. 添加构建前的权限检查"
echo "  3. 提供备用构建方法: 直接调用./node_modules/.bin/vite build"
echo "  4. 设置NODE_ENV=production环境变量"

echo ""
echo "=== 测试完成 ==="
echo "如果本地测试通过，Docker构建应该能解决权限问题"
echo ""
echo "Docker测试命令:"
echo "  docker build -f tools/docker/Dockerfile -t test-vite-fix ."
echo ""
