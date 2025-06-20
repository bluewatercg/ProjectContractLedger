# 文件上传成功但预览失败问题分析与解决方案

## 🐛 问题描述

用户反馈：上传服务器上提示上传成功，但预览提示 `{"success":false,"message":"文件不存在"}`

## 🔍 问题分析

通过对代码和配置的深入分析，发现了以下几个关键问题：

### 1. Docker卷挂载问题 ⭐ **主要问题**

**问题**: Docker配置中的卷挂载路径可能不存在或权限不正确
- 配置: `./data/uploads:/app/uploads`
- 容器内检查显示 `/app/uploads` 目录为空
- 宿主机 `deployment/data/uploads` 目录可能不存在

### 2. 文件路径生成逻辑

**当前逻辑**:
```typescript
// 合同附件路径: /app/uploads/contracts/{contractId}/{filename}_{timestamp}.ext
// 发票附件路径: /app/uploads/invoices/{invoiceId}/{filename}_{timestamp}.ext
```

### 3. 文件存在性检查

**问题**: 上传成功但文件实际未保存到正确位置
- 上传接口返回成功
- 数据库记录创建成功
- 但物理文件未正确保存

### 4. 调试信息不足

**问题**: 缺少详细的调试日志，难以定位具体问题

## ✅ 解决方案

### 方案1: 修复Docker卷挂载 (推荐)

#### 步骤1: 创建宿主机目录
```bash
cd deployment
mkdir -p data/uploads/contracts
mkdir -p data/uploads/invoices
mkdir -p data/logs
chmod -R 777 data/uploads/  # 确保容器可写
```

#### 步骤2: 重启容器
```bash
docker-compose down
docker-compose up -d
```

#### 步骤3: 验证挂载
```bash
docker exec contract-ledger-backend ls -la /app/uploads/
```

### 方案2: 增强错误处理和调试

已实施的改进:
1. **增强上传接口调试信息**
2. **增强下载/预览接口调试信息**
3. **添加文件操作验证**
4. **改进错误处理**

### 方案3: 权限和认证修复

确保预览功能的token传递正确:
```javascript
// 前端预览URL
previewUrl.value = `/api/v1/attachments/${attachment.attachment_id}/download?token=${token}`
```

## 🛠️ 实施步骤

### 立即执行
1. **运行修复脚本**:
   ```bash
   chmod +x fix-upload-issue.sh
   ./fix-upload-issue.sh
   ```

2. **检查容器状态**:
   ```bash
   docker-compose ps
   docker-compose logs -f backend
   ```

### 测试验证
1. **上传测试文件**
2. **检查文件是否保存到正确位置**
3. **测试预览功能**
4. **检查数据库记录**

## 🔧 调试工具

### 1. 容器内调试脚本
```bash
docker cp debug-container-upload.sh contract-ledger-backend:/tmp/debug.sh
docker exec contract-ledger-backend chmod +x /tmp/debug.sh
docker exec contract-ledger-backend /tmp/debug.sh
```

### 2. 本地调试脚本
```bash
node debug-upload-issue.js
```

### 3. 实时日志监控
```bash
docker-compose logs -f backend | grep -E "(上传|文件|附件)"
```

## 📊 预期结果

修复后应该看到:
1. ✅ 宿主机 `deployment/data/uploads/` 目录存在且有正确权限
2. ✅ 容器内 `/app/uploads/` 目录可正常读写
3. ✅ 上传的文件正确保存到子目录中
4. ✅ 预览功能正常工作
5. ✅ 详细的调试日志输出

## 🚨 常见问题

### Q1: 容器重启后文件丢失
**A**: 确保使用绑定挂载而不是匿名卷

### Q2: 权限拒绝错误
**A**: 检查宿主机目录权限，必要时使用 `chmod 777`

### Q3: 路径不匹配
**A**: 确认环境变量 `UPLOAD_DIR` 配置正确

## 📝 后续优化

1. **添加文件上传进度显示**
2. **实现文件去重机制**
3. **添加文件类型和大小验证**
4. **优化错误提示信息**
5. **添加文件清理定时任务**
