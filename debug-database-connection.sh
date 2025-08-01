#!/bin/bash

# 数据库连接诊断脚本
# 帮助排查数据库连接问题

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/deployment/.env"

echo "🔍 数据库连接诊断"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 检查.env文件
echo "📁 检查配置文件..."
if [ -f "$ENV_FILE" ]; then
    echo "✅ 找到.env文件: $ENV_FILE"
    
    # 读取数据库配置
    source "$ENV_FILE"
    
    echo "📋 数据库配置信息:"
    echo "   DB_HOST: $DB_HOST"
    echo "   DB_PORT: $DB_PORT"
    echo "   DB_USERNAME: $DB_USERNAME"
    echo "   DB_PASSWORD: [已隐藏]"
    echo "   DB_DATABASE: $DB_DATABASE"
else
    echo "❌ 未找到.env文件: $ENV_FILE"
    echo "请确保.env文件存在并包含数据库配置"
    exit 1
fi

# 2. 检查必要的工具
echo ""
echo "🔧 检查必要工具..."
if command -v mysql >/dev/null 2>&1; then
    echo "✅ mysql客户端已安装"
    mysql --version
else
    echo "❌ mysql客户端未安装"
    echo "安装命令:"
    echo "  Ubuntu/Debian: sudo apt-get install mysql-client"
    echo "  CentOS/RHEL: sudo yum install mysql"
    echo "  或: sudo dnf install mysql"
    exit 1
fi

if command -v mysqladmin >/dev/null 2>&1; then
    echo "✅ mysqladmin工具可用"
else
    echo "❌ mysqladmin工具不可用"
fi

# 3. 检查网络连接
echo ""
echo "🌐 检查网络连接..."
echo "测试主机连通性: $DB_HOST"

if ping -c 3 "$DB_HOST" >/dev/null 2>&1; then
    echo "✅ 主机 $DB_HOST 可以ping通"
else
    echo "❌ 主机 $DB_HOST 无法ping通"
    echo "可能的原因:"
    echo "  1. 网络不通"
    echo "  2. 主机防火墙阻止ping"
    echo "  3. IP地址错误"
fi

# 4. 检查端口连接
echo ""
echo "🔌 检查端口连接..."
if command -v telnet >/dev/null 2>&1; then
    echo "测试端口连接: $DB_HOST:$DB_PORT"
    timeout 5 telnet "$DB_HOST" "$DB_PORT" </dev/null >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ 端口 $DB_HOST:$DB_PORT 可以连接"
    else
        echo "❌ 端口 $DB_HOST:$DB_PORT 无法连接"
        echo "可能的原因:"
        echo "  1. MySQL服务未启动"
        echo "  2. 端口被防火墙阻止"
        echo "  3. 端口号错误"
    fi
else
    echo "⚠️  telnet未安装，跳过端口测试"
    echo "安装命令: sudo apt-get install telnet"
fi

# 5. 测试数据库连接
echo ""
echo "🗄️  测试数据库连接..."

# 测试基本连接
echo "测试1: 基本连接测试"
if mysqladmin -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" ping 2>/dev/null; then
    echo "✅ mysqladmin ping 成功"
else
    echo "❌ mysqladmin ping 失败"
    echo "详细错误信息:"
    mysqladmin -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" ping 2>&1 | sed 's/^/   /'
fi

# 测试数据库访问
echo ""
echo "测试2: 数据库访问测试"
if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" -e "SELECT 1;" 2>/dev/null >/dev/null; then
    echo "✅ 数据库连接成功"
else
    echo "❌ 数据库连接失败"
    echo "详细错误信息:"
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" -e "SELECT 1;" 2>&1 | sed 's/^/   /'
fi

# 测试指定数据库
echo ""
echo "测试3: 指定数据库访问测试"
if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE" -e "SELECT DATABASE();" 2>/dev/null >/dev/null; then
    echo "✅ 数据库 $DB_DATABASE 访问成功"
    
    # 显示数据库信息
    echo "📊 数据库信息:"
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE" -e "
        SELECT 
            DATABASE() as '当前数据库',
            USER() as '当前用户',
            VERSION() as 'MySQL版本';
    " 2>/dev/null | sed 's/^/   /' || echo "   无法获取数据库信息"
    
    # 显示表信息
    echo "📋 数据库表:"
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE" -e "SHOW TABLES;" 2>/dev/null | sed 's/^/   /' || echo "   无法获取表信息"
    
else
    echo "❌ 数据库 $DB_DATABASE 访问失败"
    echo "详细错误信息:"
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE" -e "SELECT DATABASE();" 2>&1 | sed 's/^/   /'
fi

# 6. 检查容器内的数据库连接
echo ""
echo "🐳 检查容器内数据库连接..."
if docker ps | grep -q "contract-ledger-backend"; then
    echo "✅ 后端容器正在运行"
    
    echo "容器内环境变量:"
    docker exec contract-ledger-backend env | grep -E "DB_|MYSQL_" | sed 's/^/   /' || echo "   无相关环境变量"
    
    # 测试容器内连接
    echo ""
    echo "测试容器内数据库连接:"
    if docker exec contract-ledger-backend node -e "
        const mysql = require('mysql2/promise');
        (async () => {
            try {
                const connection = await mysql.createConnection({
                    host: process.env.DB_HOST,
                    port: process.env.DB_PORT,
                    user: process.env.DB_USERNAME,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_DATABASE
                });
                console.log('✅ 容器内数据库连接成功');
                await connection.end();
            } catch (error) {
                console.log('❌ 容器内数据库连接失败:', error.message);
            }
        })();
    " 2>/dev/null; then
        echo "   容器内连接测试完成"
    else
        echo "   ⚠️  无法在容器内测试连接（可能缺少node或mysql2模块）"
    fi
else
    echo "⚠️  后端容器未运行"
fi

# 7. 提供解决方案
echo ""
echo "🛠️  解决方案建议:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 根据测试结果给出具体建议
if ! command -v mysql >/dev/null 2>&1; then
    echo "🔴 1. 安装MySQL客户端:"
    echo "   sudo apt-get update && sudo apt-get install mysql-client"
fi

if ! ping -c 1 "$DB_HOST" >/dev/null 2>&1; then
    echo "🔴 2. 检查网络连接:"
    echo "   - 确认IP地址是否正确: $DB_HOST"
    echo "   - 检查网络连通性"
    echo "   - 确认防火墙设置"
fi

echo "🟡 3. 检查MySQL服务器设置:"
echo "   - 确认MySQL服务正在运行"
echo "   - 检查bind-address配置（应允许外部连接）"
echo "   - 确认端口 $DB_PORT 已开放"

echo "🟡 4. 检查用户权限:"
echo "   - 确认用户 $DB_USERNAME 存在"
echo "   - 确认密码正确"
echo "   - 确认用户有远程连接权限"
echo "   - MySQL命令示例:"
echo "     CREATE USER '$DB_USERNAME'@'%' IDENTIFIED BY 'password';"
echo "     GRANT ALL PRIVILEGES ON $DB_DATABASE.* TO '$DB_USERNAME'@'%';"
echo "     FLUSH PRIVILEGES;"

echo "🟡 5. 测试手动连接:"
echo "   mysql -h$DB_HOST -P$DB_PORT -u$DB_USERNAME -p$DB_PASSWORD $DB_DATABASE"

echo ""
echo "✅ 诊断完成！请根据上述结果解决连接问题。"