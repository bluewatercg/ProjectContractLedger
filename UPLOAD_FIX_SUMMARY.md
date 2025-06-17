# 文件上传问题修复总结

## 🔍 问题分析

### 根本原因
前后端打包在同一个Docker镜像确实导致了文件上传失败，主要问题包括：

1. **工作目录不匹配**
   - 后端服务在 `/app/backend` 目录启动
   - 上传目录创建在 `/app/uploads`
   - `process.cwd()` 返回 `/app/backend`，导致实际上传路径变成 `/app/backend/uploads`

2. **路径配置冲突**
   - 代码中使用相对路径 `process.cwd() + 'uploads'`
   - Docker配置中创建的是绝对路径 `/app/uploads`

3. **文件大小限制不匹配**
   - Nginx: 50MB (`client_max_body_size 50M`)
   - 后端: 10MB (`fileSize: '10mb'`)

## 🛠️ 修复方案

### 1. 修复文件路径问题

#### 修改合同附件服务
```typescript
// apps/backend/src/service/contract-attachment.service.ts
generateFilePath(contractId: number, originalName: string): string {
  // 使用配置中的上传目录，确保在Docker容器中路径正确
  const baseUploadDir = this.uploadConfig?.uploadDir || '/app/uploads';
  const uploadDir = path.join(
    baseUploadDir,  // 使用绝对路径而不是 process.cwd()
    'contracts',
    contractId.toString()
  );
  // ...
}
```

#### 修改发票附件服务
```typescript
// apps/backend/src/service/invoice-attachment.service.ts
generateFilePath(invoiceId: number, originalName: string): string {
  // 使用配置中的上传目录，确保在Docker容器中路径正确
  const baseUploadDir = this.uploadConfig?.uploadDir || '/app/uploads';
  const uploadDir = path.join(
    baseUploadDir,  // 使用绝对路径而不是 process.cwd()
    'invoices',
    invoiceId.toString()
  );
  // ...
}
```

### 2. 添加配置支持

#### 后端配置
```typescript
// apps/backend/src/config/config.default.ts
upload: {
  mode: 'file',
  fileSize: '10mb',
  whitelist: ['.pdf', '.jpg', '.jpeg', '.png'],
  tmpdir: '/tmp',
  cleanTimeout: 5 * 60 * 1000,
  // 新增：上传文件存储目录（支持环境变量配置）
  uploadDir: process.env.UPLOAD_DIR || '/app/uploads',
},
```

#### Docker环境变量
```dockerfile
# tools/docker/Dockerfile
ENV NODE_ENV=production \
    BACKEND_PORT=8080 \
    FRONTEND_HTTP_PORT=80 \
    LOG_LEVEL=info \
    CORS_ORIGINS=* \
    JWT_EXPIRES_IN=7d \
    UPLOAD_DIR=/app/uploads
```

### 3. 修复文件大小限制

#### Nginx配置
```nginx
# tools/nginx/nginx.conf
location /api/ {
    # 请求体大小限制（与后端配置保持一致）
    client_max_body_size 10M;
    # ...
}
```

## 🧪 测试验证

### 使用测试脚本
```bash
# 运行测试脚本
./scripts/test-upload-fix.sh

# 清理测试环境
./scripts/test-upload-fix.sh cleanup
```

### 手动测试步骤

1. **构建修复后的镜像**
   ```bash
   docker build -f tools/docker/Dockerfile -t contract-ledger-fixed .
   ```

2. **启动容器**
   ```bash
   docker run -d \
     --name contract-ledger-test \
     -p 8080:8080 -p 80:80 \
     -e UPLOAD_DIR=/app/uploads \
     -v uploads:/app/uploads \
     contract-ledger-fixed
   ```

3. **检查上传目录**
   ```bash
   docker exec contract-ledger-test ls -la /app/uploads
   docker exec contract-ledger-test pwd  # 确认工作目录
   ```

4. **测试文件上传**
   - 访问 http://localhost
   - 尝试上传合同或发票附件
   - 检查文件是否正确保存到 `/app/uploads`

## 📋 修复文件清单

### 已修改的文件
- ✅ `apps/backend/src/service/contract-attachment.service.ts`
- ✅ `apps/backend/src/service/invoice-attachment.service.ts`
- ✅ `apps/backend/src/config/config.default.ts`
- ✅ `tools/nginx/nginx.conf`
- ✅ `tools/docker/Dockerfile`

### 新增的文件
- ✅ `scripts/test-upload-fix.sh` - 测试脚本
- ✅ `UPLOAD_FIX_SUMMARY.md` - 修复总结文档

## 🔧 部署建议

### 生产环境部署
1. **重新构建镜像**
   ```bash
   docker build -f tools/docker/Dockerfile -t your-registry/contract-ledger:fixed .
   ```

2. **推送到镜像仓库**
   ```bash
   docker push your-registry/contract-ledger:fixed
   ```

3. **更新部署配置**
   - 确保 `UPLOAD_DIR` 环境变量正确设置
   - 确保上传目录有持久化存储卷映射

### 环境变量配置
```bash
# 在 .env 文件中添加
UPLOAD_DIR=/app/uploads
```

## 🎯 预期效果

修复后，文件上传功能应该能够：

1. ✅ 正确识别上传目录路径
2. ✅ 在容器中创建正确的目录结构
3. ✅ 文件大小限制一致（10MB）
4. ✅ 支持PDF、JPG、JPEG、PNG格式
5. ✅ 文件正确保存到 `/app/uploads/contracts/` 或 `/app/uploads/invoices/`
6. ✅ 数据库记录正确创建

## 🚨 注意事项

1. **数据迁移**: 如果之前有上传的文件，需要将它们从错误路径迁移到正确路径
2. **权限检查**: 确保容器中的用户对上传目录有写权限
3. **存储卷**: 生产环境中确保上传目录映射到持久化存储
4. **备份**: 部署前备份现有数据

## 📞 后续支持

如果修复后仍有问题，请检查：
1. 容器日志: `docker logs <container-name>`
2. 上传目录权限: `docker exec <container> ls -la /app/uploads`
3. 环境变量: `docker exec <container> env | grep UPLOAD`
4. 网络连接: 确保前端能正确访问后端API
