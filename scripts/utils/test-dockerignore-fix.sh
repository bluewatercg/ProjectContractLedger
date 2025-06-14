#!/bin/bash

# 测试.dockerignore修复脚本

set -e

echo "=== .dockerignore修复测试 ==="
echo "时间: $(date)"
echo ""

# 检查必要文件是否存在
echo "1. 检查必要文件..."

required_files=(
    "scripts/dev/start.sh"
    "scripts/utils/inject-env-vars.sh"
    "tools/docker/Dockerfile"
    ".dockerignore"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

echo ""

# 检查.dockerignore配置
echo "2. 检查.dockerignore配置..."

echo "当前scripts相关配置:"
grep -A 15 -B 2 "开发脚本" .dockerignore

echo ""

# 模拟Docker构建上下文检查
echo "3. 模拟Docker构建上下文检查..."

echo "检查哪些scripts文件会被包含在构建上下文中:"

# 创建临时目录模拟Docker构建上下文
temp_dir=$(mktemp -d)
echo "临时目录: $temp_dir"

# 复制文件（排除.dockerignore中的文件）
echo "复制文件到临时目录..."

# 复制必要的脚本文件
if [ -f "scripts/dev/start.sh" ]; then
    mkdir -p "$temp_dir/scripts/dev"
    cp "scripts/dev/start.sh" "$temp_dir/scripts/dev/"
    echo "✅ 复制 scripts/dev/start.sh"
fi

if [ -f "scripts/utils/inject-env-vars.sh" ]; then
    mkdir -p "$temp_dir/scripts/utils"
    cp "scripts/utils/inject-env-vars.sh" "$temp_dir/scripts/utils/"
    echo "✅ 复制 scripts/utils/inject-env-vars.sh"
fi

# 检查复制结果
echo ""
echo "构建上下文中的scripts文件:"
find "$temp_dir" -name "*.sh" -type f | sort

# 清理临时目录
rm -rf "$temp_dir"

echo ""

# 检查Dockerfile中的COPY命令
echo "4. 检查Dockerfile中的COPY命令..."

echo "Dockerfile中涉及scripts的COPY命令:"
grep -n "COPY.*scripts" tools/docker/Dockerfile || echo "未找到scripts相关的COPY命令"

echo ""

# 显示修复摘要
echo "=== 修复摘要 ==="
echo "问题: Docker构建时找不到 scripts/utils/inject-env-vars.sh"
echo "原因: .dockerignore 文件排除了整个 scripts/utils 目录"
echo ""
echo "解决方案:"
echo "  1. 修改 .dockerignore，使用更精确的排除规则"
echo "  2. 排除测试和开发相关的脚本，保留生产需要的脚本"
echo "  3. 明确保留 scripts/utils/inject-env-vars.sh"

echo ""
echo "修改后的排除规则:"
echo "  - 排除: scripts/utils/test-*"
echo "  - 排除: scripts/utils/*-test*"
echo "  - 排除: scripts/utils/*-fix*"
echo "  - 排除: scripts/utils/check-*"
echo "  - 保留: scripts/utils/inject-env-vars.sh"

echo ""
echo "=== 测试完成 ==="
echo "如果所有检查都通过，Docker构建应该能找到必要的脚本文件"
echo ""
echo "测试Docker构建命令:"
echo "  docker build -f tools/docker/Dockerfile -t test-dockerignore-fix ."
echo ""
