#!/bin/bash

# 系统监控脚本

echo "=== 合同管理系统 - 系统监控 ==="

# 进入脚本所在目录
cd "$(dirname "$0")"

# 检查 Docker 服务状态
echo "1. Docker 服务状态:"
echo "==================="
if docker-compose ps 2>/dev/null; then
    echo "✓ Docker Compose 服务正常"
else
    echo "✗ Docker Compose 服务异常"
fi

echo ""

# 检查容器健康状态
echo "2. 容器健康状态:"
echo "==================="
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""

# 检查资源使用情况
echo "3. 资源使用情况:"
echo "==================="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"

echo ""

# 检查磁盘使用情况
echo "4. 磁盘使用情况:"
echo "==================="
echo "系统磁盘:"
df -h | grep -E "(Filesystem|/dev/)"

echo ""
echo "数据目录:"
if [ -d "data" ]; then
    du -sh data/*
else
    echo "数据目录不存在"
fi

echo ""

# 检查日志文件
echo "5. 日志文件状态:"
echo "==================="
if [ -d "data/logs" ]; then
    echo "日志文件列表:"
    ls -la data/logs/
    echo ""
    echo "日志文件大小:"
    du -sh data/logs/*
    echo ""
    echo "最新错误日志 (最后10行):"
    if [ -f "data/logs/error.log" ]; then
        tail -10 data/logs/error.log
    elif [ -f "data/logs/app-error.log" ]; then
        tail -10 data/logs/app-error.log
    else
        echo "未找到错误日志文件"
    fi
else
    echo "日志目录不存在"
fi

echo ""

# 检查附件存储
echo "6. 附件存储状态:"
echo "==================="
if [ -d "data/uploads" ]; then
    echo "附件目录大小:"
    du -sh data/uploads/
    echo ""
    echo "附件文件统计:"
    find data/uploads/ -type f | wc -l | xargs echo "总文件数:"
    find data/uploads/ -name "*.pdf" | wc -l | xargs echo "PDF文件:"
    find data/uploads/ -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | wc -l | xargs echo "图片文件:"
else
    echo "附件目录不存在"
fi

echo ""

# 检查网络连接
echo "7. 网络连接状态:"
echo "==================="
echo "端口监听状态:"
netstat -tlnp 2>/dev/null | grep -E "(80|8080|3306|6379)" || echo "netstat 命令不可用，跳过端口检查"

echo ""

# 检查最近的应用日志
echo "8. 最近的应用日志:"
echo "==================="
if [ -f "data/logs/app.log" ]; then
    echo "最新应用日志 (最后20行):"
    tail -20 data/logs/app.log
else
    echo "应用日志文件不存在，检查容器日志:"
    docker-compose logs --tail=20 app 2>/dev/null || echo "无法获取容器日志"
fi

echo ""
echo "=== 监控完成 ==="
echo "监控时间: $(date)"

# 如果有错误，返回非零退出码
if ! docker-compose ps | grep -q "Up"; then
    echo "警告: 发现服务异常"
    exit 1
fi
