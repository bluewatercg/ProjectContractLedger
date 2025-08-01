#!/bin/bash

# 检查Docker容器环境变量和docker-compose配置脚本

echo "🐳 Docker环境变量和配置检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 检查运行中的容器
echo "📋 检查运行中的容器:"
if docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | grep -E "contract|ledger"; then
    echo ""
else
    echo "⚠️  未找到相关容器"
fi

# 2. 检查后端容器环境变量
echo ""
echo "🔍 检查后端容器环境变量:"
if docker ps | grep -q "contract-ledger-backend"; then
    echo "✅ 后端容器正在运行"
    
    echo ""
    echo "📋 数据库相关环境变量:"
    docker exec contract-ledger-backend env | grep -E "DB_|MYSQL_" | sort | sed 's/^/   /' || echo "   无数据库相关环境变量"
    
    echo ""
    echo "📋 上传相关环境变量:"
    docker exec contract-ledger-backend env | grep -E "UPLOAD_" | sed 's/^/   /' || echo "   无上传相关环境变量"
    
    echo ""
    echo "📋 JWT相关环境变量:"
    docker exec contract-ledger-backend env | grep -E "JWT_" | sed 's/^/   /' || echo "   无JWT相关环境变量"
    
    echo ""
    echo "📋 Redis相关环境变量:"
    docker exec contract-ledger-backend env | grep -E "REDIS_" | sed 's/^/   /' || echo "   无Redis相关环境变量"
    
    echo ""
    echo "📋 其他应用相关环境变量:"
    docker exec contract-ledger-backend env | grep -E "NODE_ENV|API_VERSION|CORS_|LOG_|TZ" | sed 's/^/   /' || echo "   无其他应用相关环境变量"
    
    echo ""
    echo "📋 所有环境变量 (前20个):"
    docker exec contract-ledger-backend env | head -20 | sed 's/^/   /'
    
else
    echo "❌ 后端容器未运行"
    echo "📋 所有容器状态:"
    docker ps -a | grep -E "contract|ledger" | sed 's/^/   /' || echo "   无相关容器"
fi

# 3. 检查docker-compose文件配置
echo ""
echo "🐳 检查docker-compose文件配置:"

# 查找所有可能的docker-compose文件
COMPOSE_FILES=(
    "docker-compose.yml"
    "docker-compose.separated.yml" 
    "deployment/docker-compose.yml"
    "deployment/docker-compose.separated.yml"
)

for compose_file in "${COMPOSE_FILES[@]}"; do
    echo ""
    echo "📄 检查: $compose_file"
    
    if [ -f "$compose_file" ]; then
        echo "   ✅ 文件存在"
        
        # 检查env_file配置
        if grep -q "env_file" "$compose_file"; then
            echo "   📋 env_file配置:"
            grep -A3 -B1 "env_file" "$compose_file" | sed 's/^/      /'
        else
            echo "   ⚠️  未找到env_file配置"
        fi
        
        # 检查environment配置
        if grep -q "environment:" "$compose_file"; then
            echo "   📋 environment配置 (前10行):"
            grep -A10 "environment:" "$compose_file" | head -15 | sed 's/^/      /'
        else
            echo "   ⚠️  未找到environment配置"
        fi
        
        # 检查volumes配置
        if grep -q "volumes:" "$compose_file"; then
            echo "   📋 volumes配置:"
            grep -A5 "volumes:" "$compose_file" | grep -E "uploads|logs" | sed 's/^/      /' || echo "      无uploads/logs相关卷"
        fi
        
    else
        echo "   ❌ 文件不存在"
    fi
done

# 4. 检查Docker卷
echo ""
echo "💾 检查Docker卷:"
echo "📋 所有卷:"
docker volume ls | sed 's/^/   /'

echo ""
echo "📋 backend相关卷:"
docker volume ls | grep -E "backend|upload|log" | sed 's/^/   /' || echo "   无相关卷"

# 检查卷的详细信息
if docker volume ls | grep -q "backend_uploads"; then
    echo ""
    echo "📂 backend_uploads卷详情:"
    docker volume inspect backend_uploads | sed 's/^/   /'
fi

# 5. 检查容器的挂载信息
echo ""
echo "🔗 检查容器挂载信息:"
if docker ps | grep -q "contract-ledger-backend"; then
    echo "📋 后端容器挂载点:"
    docker inspect contract-ledger-backend | grep -A10 -B5 "Mounts" | sed 's/^/   /' || echo "   无法获取挂载信息"
    
    echo ""
    echo "📋 容器内目录结构:"
    echo "   /app目录:"
    docker exec contract-ledger-backend ls -la /app/ | sed 's/^/      /' || echo "      无法访问/app目录"
    
    echo "   /app/uploads目录:"
    docker exec contract-ledger-backend ls -la /app/uploads/ | sed 's/^/      /' || echo "      无法访问/app/uploads目录"
fi

# 6. 检查实际使用的docker-compose命令
echo ""
echo "🔍 检查可能的启动方式:"
echo "📋 常见的docker-compose启动命令:"
echo "   1. docker-compose up -d"
echo "   2. docker-compose -f docker-compose.separated.yml up -d"
echo "   3. docker-compose -f deployment/docker-compose.yml up -d"
echo "   4. docker-compose -f deployment/docker-compose.separated.yml up -d"

# 7. 检查.env文件与容器环境变量的对应关系
echo ""
echo "🔄 检查.env文件与容器环境变量对应关系:"

# 查找.env文件
ENV_FILES=(
    ".env"
    "deployment/.env"
    ".env.production"
    "deployment/.env.production"
)

for env_file in "${ENV_FILES[@]}"; do
    if [ -f "$env_file" ]; then
        echo ""
        echo "📄 检查: $env_file"
        echo "   ✅ 文件存在"
        
        if docker ps | grep -q "contract-ledger-backend"; then
            echo "   🔍 对比.env文件与容器环境变量:"
            
            # 检查数据库配置
            if grep -q "DB_HOST" "$env_file"; then
                ENV_DB_HOST=$(grep "DB_HOST" "$env_file" | cut -d'=' -f2 | tr -d '"')
                CONTAINER_DB_HOST=$(docker exec contract-ledger-backend env | grep "DB_HOST" | cut -d'=' -f2 || echo "未设置")
                echo "      DB_HOST: .env[$ENV_DB_HOST] vs 容器[$CONTAINER_DB_HOST]"
            fi
            
            if grep -q "DB_USERNAME" "$env_file"; then
                ENV_DB_USER=$(grep "DB_USERNAME" "$env_file" | cut -d'=' -f2 | tr -d '"')
                CONTAINER_DB_USER=$(docker exec contract-ledger-backend env | grep "DB_USERNAME" | cut -d'=' -f2 || echo "未设置")
                echo "      DB_USERNAME: .env[$ENV_DB_USER] vs 容器[$CONTAINER_DB_USER]"
            fi
            
            if grep -q "DB_DATABASE" "$env_file"; then
                ENV_DB_NAME=$(grep "DB_DATABASE" "$env_file" | cut -d'=' -f2 | tr -d '"')
                CONTAINER_DB_NAME=$(docker exec contract-ledger-backend env | grep "DB_DATABASE" | cut -d'=' -f2 || echo "未设置")
                echo "      DB_DATABASE: .env[$ENV_DB_NAME] vs 容器[$CONTAINER_DB_NAME]"
            fi
        fi
    fi
done

echo ""
echo "✅ Docker环境检查完成！"
echo ""
echo "💡 根据以上信息，可以确定:"
echo "   1. 容器是否正确加载了.env文件"
echo "   2. 哪个docker-compose文件被使用"
echo "   3. 环境变量是否正确传递到容器"
echo "   4. 备份脚本应该使用哪个.env文件路径"