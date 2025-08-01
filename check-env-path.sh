#!/bin/bash

# 检查.env文件路径脚本
# 用于确认实际部署环境中.env文件的位置

echo "🔍 检查.env文件路径"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 获取当前脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 当前脚本目录: $SCRIPT_DIR"

# 检查可能的.env文件位置
echo ""
echo "🔍 检查可能的.env文件位置:"

# 1. 脚本同级目录下的deployment/.env
ENV_PATH1="$SCRIPT_DIR/deployment/.env"
echo "1. $ENV_PATH1"
if [ -f "$ENV_PATH1" ]; then
    echo "   ✅ 文件存在"
    echo "   📋 文件内容预览:"
    head -5 "$ENV_PATH1" | sed 's/^/      /'
else
    echo "   ❌ 文件不存在"
fi

# 2. 脚本同级目录下的.env
ENV_PATH2="$SCRIPT_DIR/.env"
echo ""
echo "2. $ENV_PATH2"
if [ -f "$ENV_PATH2" ]; then
    echo "   ✅ 文件存在"
    echo "   📋 文件内容预览:"
    head -5 "$ENV_PATH2" | sed 's/^/      /'
else
    echo "   ❌ 文件不存在"
fi

# 3. 当前工作目录下的.env
ENV_PATH3="$(pwd)/.env"
echo ""
echo "3. $ENV_PATH3"
if [ -f "$ENV_PATH3" ]; then
    echo "   ✅ 文件存在"
    echo "   📋 文件内容预览:"
    head -5 "$ENV_PATH3" | sed 's/^/      /'
else
    echo "   ❌ 文件不存在"
fi

# 4. 当前工作目录下的deployment/.env
ENV_PATH4="$(pwd)/deployment/.env"
echo ""
echo "4. $ENV_PATH4"
if [ -f "$ENV_PATH4" ]; then
    echo "   ✅ 文件存在"
    echo "   📋 文件内容预览:"
    head -5 "$ENV_PATH4" | sed 's/^/      /'
else
    echo "   ❌ 文件不存在"
fi

# 5. 查找所有.env文件
echo ""
echo "🔍 在当前目录及子目录中查找所有.env文件:"
find . -name ".env" -type f 2>/dev/null | while read env_file; do
    echo "   📄 $env_file"
    if [ -r "$env_file" ]; then
        echo "      📋 内容预览:"
        head -3 "$env_file" | sed 's/^/         /'
    else
        echo "      ⚠️  无法读取"
    fi
done

# 6. 检查Docker容器中的环境变量
echo ""
echo "🐳 检查Docker容器中的环境变量:"
if docker ps | grep -q "contract-ledger-backend"; then
    echo "✅ 后端容器正在运行"
    echo "📋 容器中的数据库相关环境变量:"
    docker exec contract-ledger-backend env | grep -E "DB_|MYSQL_" | sed 's/^/   /' || echo "   无相关环境变量"
else
    echo "⚠️  后端容器未运行"
fi

# 7. 检查docker-compose文件位置
echo ""
echo "🐳 检查docker-compose文件位置:"
for compose_file in "docker-compose.yml" "docker-compose.separated.yml" "deployment/docker-compose.yml" "deployment/docker-compose.separated.yml"; do
    if [ -f "$compose_file" ]; then
        echo "   ✅ $compose_file"
        # 检查env_file配置
        if grep -q "env_file" "$compose_file"; then
            echo "      📋 env_file配置:"
            grep -A2 -B2 "env_file" "$compose_file" | sed 's/^/         /'
        fi
    else
        echo "   ❌ $compose_file (不存在)"
    fi
done

# 8. 提供建议
echo ""
echo "💡 建议:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 找到存在的.env文件
FOUND_ENV=""
for path in "$ENV_PATH1" "$ENV_PATH2" "$ENV_PATH3" "$ENV_PATH4"; do
    if [ -f "$path" ]; then
        FOUND_ENV="$path"
        break
    fi
done

if [ -n "$FOUND_ENV" ]; then
    echo "✅ 找到.env文件: $FOUND_ENV"
    echo "📝 建议在backup-system.sh中使用以下路径:"
    echo "   ENV_FILE=\"$FOUND_ENV\""
else
    echo "❌ 未找到.env文件"
    echo "📝 请确认:"
    echo "   1. .env文件是否存在"
    echo "   2. 文件权限是否正确"
    echo "   3. 是否在正确的目录中运行脚本"
fi

echo ""
echo "✅ 路径检查完成！"