#!/bin/bash

echo "启动客户合同管理系统 - Midway版本"
echo "====================================="

echo ""
echo "1. 启动后端服务..."
cd apps/backend
gnome-terminal --title="Midway Backend" -- bash -c "yarn dev; exec bash" &

echo ""
echo "2. 等待3秒后启动前端服务..."
sleep 3

cd ../frontend
gnome-terminal --title="Midway Frontend" -- bash -c "yarn dev; exec bash" &

echo ""
echo "服务启动完成！"
echo "前端地址: http://localhost:8000"
echo "后端地址: http://localhost:8080"
echo "API文档: http://localhost:8080/api-docs"
echo ""
