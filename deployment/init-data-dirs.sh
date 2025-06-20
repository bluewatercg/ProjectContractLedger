#!/bin/bash

# 初始化数据目录脚本
# 创建必要的数据目录并设置正确的权限

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}正在初始化数据目录...${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/data"

# 创建数据目录
echo "创建数据目录: $DATA_DIR"
mkdir -p "$DATA_DIR"

# 创建子目录
echo "创建日志目录: $DATA_DIR/logs"
mkdir -p "$DATA_DIR/logs"

echo "创建上传目录: $DATA_DIR/uploads"
mkdir -p "$DATA_DIR/uploads"

# 创建上传子目录结构
echo "创建上传子目录..."
mkdir -p "$DATA_DIR/uploads/contracts"
mkdir -p "$DATA_DIR/uploads/invoices"
mkdir -p "$DATA_DIR/uploads/temp"

# 设置权限 (确保Docker容器可以写入)
echo "设置目录权限..."
chmod -R 755 "$DATA_DIR/logs"

# 为上传目录设置777权限，确保容器内midway用户（UID 1001）可以写入
echo "设置上传目录权限（解决权限问题）..."
chmod -R 777 "$DATA_DIR/uploads"

# 如果是Linux系统，尝试设置适当的所有者
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "${YELLOW}检测到Linux系统，尝试设置目录所有者...${NC}"

    # 尝试设置为容器内的用户ID（midway用户，UID 1001）
    if command -v chown &> /dev/null; then
        echo "尝试设置所有者为1001:1001（容器内midway用户）"
        chown -R 1001:1001 "$DATA_DIR" 2>/dev/null || {
            echo -e "${YELLOW}无法设置所有者，使用777权限模式${NC}"
        }
    fi
else
    echo -e "${YELLOW}非Linux系统，使用777权限模式${NC}"
fi

# 创建.gitkeep文件以保持目录结构
echo "创建.gitkeep文件..."
touch "$DATA_DIR/logs/.gitkeep"
touch "$DATA_DIR/uploads/.gitkeep"
touch "$DATA_DIR/uploads/contracts/.gitkeep"
touch "$DATA_DIR/uploads/invoices/.gitkeep"
touch "$DATA_DIR/uploads/temp/.gitkeep"

# 显示目录结构
echo -e "${GREEN}数据目录结构创建完成：${NC}"
tree "$DATA_DIR" 2>/dev/null || find "$DATA_DIR" -type d | sed 's|[^/]*/|  |g'

echo ""
echo -e "${GREEN}✅ 数据目录初始化完成！${NC}"
echo ""
echo "目录说明："
echo "  📁 $DATA_DIR/logs/     - 应用日志文件"
echo "  📁 $DATA_DIR/uploads/  - 上传文件存储"
echo "    📁 contracts/        - 合同附件"
echo "    📁 invoices/         - 发票附件"
echo "    📁 temp/             - 临时文件"
echo ""
echo "现在您可以："
echo "1. 启动服务: docker-compose up -d"
echo "2. 查看上传文件: ls -la $DATA_DIR/uploads/"
echo "3. 查看日志文件: ls -la $DATA_DIR/logs/"
