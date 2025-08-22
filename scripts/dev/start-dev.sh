#!/bin/bash

# 获取脚本所在的目录，并切换到项目根目录 (上两级)
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd "$SCRIPT_DIR/../.."

echo "启动客户合同管理系统 - Midway版本"
echo "====================================="

echo ""
echo "1. 启动后端服务..."
cd apps/backend
start "Midway Backend" cmd /d /k "yarn dev"

echo ""
echo "2. 等待3秒后启动前端服务..."
sleep 3

cd ../frontend
start "Midway Frontend" cmd /d /k "yarn dev"

echo ""
echo "服务启动完成！"
echo "前端地址: http://localhost:8000"
echo "后端地址: http://localhost:8080"
echo "API文档: http://localhost:8080/api-docs"
echo ""