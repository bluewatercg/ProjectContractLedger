# 故障排除指南

本文档整合了项目部署和使用过程中的常见问题及解决方案。

## 📁 文件上传问题

### 问题1：上传成功但预览失败
**症状**：上传提示成功，但预览时显示"文件不存在"

**原因**：Docker卷挂载权限或路径配置问题

**解决方案**：
```bash
# 1. 检查上传目录权限
sudo ls -la /opt/projectcontractledger/backend_uploads

# 2. 修复权限
sudo chmod -R 777 /opt/projectcontractledger/backend_uploads

# 3. 重启容器
docker-compose restart backend
```

### 问题2：容器内无法创建文件
**症状**：上传时报权限错误

**解决方案**：
```bash
# 使用维护工具修复
cd tools/maintenance
./fix-contract-upload-issue.sh
```

## 🐳 Docker部署问题

### 问题1：容器启动失败
**症状**：docker-compose up 失败

**排查步骤**：
```bash
# 1. 检查日志
docker-compose logs backend

# 2. 检查环境变量
cd tools/maintenance
./check-docker-env.sh

# 3. 验证配置文件
source deployment/.env && echo "配置正确"
```

### 问题2：数据库连接失败
**症状**：后端无法连接数据库

**解决方案**：
```bash
# 1. 测试数据库连接
cd tools/maintenance
./debug-database-connection.sh

# 2. 检查网络连通性
ping 192.168.1.254
telnet 192.168.1.254 3306
```

## 🔧 API路径问题

### 问题1：404错误
**症状**：前端请求API返回404

**检查项目**：
1. API版本配置是否正确
2. 前后端API_BASE_URL是否一致
3. Nginx代理配置是否正确

**解决方案**：
```bash
# 检查API配置
grep -r "API_BASE_URL" deployment/.env
grep -r "api/" apps/frontend/src/
```

## 🔐 认证问题

### 问题1：登录失败
**症状**：用户名密码正确但无法登录

**排查步骤**：
1. 检查JWT_SECRET配置
2. 验证数据库用户表
3. 查看后端认证日志

## 📊 性能问题

### 问题1：响应缓慢
**可能原因**：
- 数据库查询未优化
- 文件上传大小超限
- 网络连接问题

**优化建议**：
- 添加数据库索引
- 启用Redis缓存
- 优化前端资源加载

## 🛠️ 维护工具

项目提供了完整的维护工具集：

```bash
# 备份相关
cd tools/backup
./backup-system.sh              # 系统备份
./restore-system.sh             # 系统恢复
./setup-auto-backup.sh          # 设置自动备份
./check-backup-status.sh        # 检查备份状态

# 问题诊断
cd tools/maintenance
./debug-database-connection.sh  # 数据库连接诊断
./check-docker-env.sh          # Docker环境检查
./fix-contract-upload-issue.sh # 修复上传问题
```

## 🔧 高级故障排除

### 系统性能问题

#### 1. 数据库查询缓慢
**症状**：页面加载时间过长，API响应缓慢

**诊断步骤**：
```bash
# 检查数据库连接
cd tools/maintenance
./debug-database-connection.sh

# 查看慢查询日志
mysql -u root -p -e "SHOW VARIABLES LIKE 'slow_query_log';"
mysql -u root -p -e "SHOW VARIABLES LIKE 'long_query_time';"

# 分析查询性能
mysql -u root -p -e "SHOW PROCESSLIST;"
```

**解决方案**：
```bash
# 应用数据库索引优化
yarn apply-indexes

# 重启数据库服务
sudo systemctl restart mysql

# 清理查询缓存
mysql -u root -p -e "RESET QUERY CACHE;"
```

#### 2. 内存使用过高
**症状**：系统响应缓慢，可能出现内存不足错误

**诊断步骤**：
```bash
# 检查系统内存使用
free -h
top -p $(pgrep node)

# 检查Node.js内存使用
node --inspect apps/backend/bootstrap.js
```

**解决方案**：
```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 重启应用服务
yarn restart

# 清理应用缓存
curl -X DELETE http://localhost:8080/api/v1/statistics/cache/clear
```

### 网络连接问题

#### 1. API请求超时
**症状**：前端请求后端API超时

**诊断步骤**：
```bash
# 测试网络连通性
ping localhost
telnet localhost 8080

# 检查防火墙设置
sudo ufw status
sudo iptables -L

# 测试API响应
curl -v http://localhost:8080/api/v1/health
```

**解决方案**：
```bash
# 调整超时设置
# 在 apps/frontend/.env.development 中设置
VITE_API_TIMEOUT=30000

# 检查代理设置
# 在 apps/frontend/vite.config.ts 中配置代理
```

#### 2. 跨域问题
**症状**：浏览器控制台显示CORS错误

**解决方案**：
```typescript
// apps/backend/src/config/config.default.ts
export default {
  cors: {
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
    credentials: true,
  },
};
```

### 文件系统问题

#### 1. 磁盘空间不足
**症状**：文件上传失败，系统日志显示磁盘空间不足

**诊断步骤**：
```bash
# 检查磁盘使用情况
df -h

# 查找大文件
du -sh /* | sort -rh | head -10

# 检查日志文件大小
du -sh apps/backend/logs/*
du -sh tools/docker/data/logs/*
```

**解决方案**：
```bash
# 清理旧日志文件
find apps/backend/logs -name "*.log" -mtime +30 -delete

# 清理Docker日志
docker system prune -f

# 清理上传的临时文件
find uploads/temp -mtime +1 -delete
```

#### 2. 文件权限问题
**症状**：无法创建或访问文件

**解决方案**：
```bash
# 修复上传目录权限
sudo chown -R $USER:$USER uploads/
chmod -R 755 uploads/

# Docker环境权限修复
cd tools/maintenance
./fix-contract-upload-issue.sh
```

### 数据一致性问题

#### 1. 缓存数据不一致
**症状**：页面显示的数据与数据库中的数据不一致

**解决方案**：
```bash
# 清除所有缓存
curl -X DELETE http://localhost:8080/api/v1/statistics/cache/clear

# 重启Redis服务
sudo systemctl restart redis

# 重启应用服务
yarn restart
```

#### 2. 数据库事务问题
**症状**：数据更新不完整或出现脏数据

**诊断步骤**：
```bash
# 检查数据库事务隔离级别
mysql -u root -p -e "SELECT @@tx_isolation;"

# 查看锁等待情况
mysql -u root -p -e "SHOW ENGINE INNODB STATUS\G" | grep -A 20 "TRANSACTIONS"
```

**解决方案**：
```sql
-- 检查并修复表
CHECK TABLE customers, contracts, invoices, payments;
REPAIR TABLE customers, contracts, invoices, payments;

-- 重建索引
OPTIMIZE TABLE customers, contracts, invoices, payments;
```

## 📞 获取帮助

如果以上解决方案无法解决问题：

1. **查看日志**：`docker logs contract-ledger-backend`
2. **运行诊断工具**：使用 `tools/maintenance/` 下的脚本
3. **检查GitHub Issues**：查看是否有类似问题
4. **提交Issue**：提供详细的错误信息和环境配置

## 🔄 定期维护

建议定期执行以下维护任务：

```bash
# 每周备份
cd tools/backup && ./backup-system.sh

# 每月检查
cd tools/maintenance && ./check-backup-status.sh

# 清理日志（根据需要）
docker system prune -f
```