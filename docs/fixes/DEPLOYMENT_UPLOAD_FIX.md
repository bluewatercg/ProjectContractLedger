# 生产环境部署上传权限修复

## 🎯 问题解决方案

针对生产环境只能通过 `./deploy-separated.sh` 自动部署的限制，我已经将权限修复集成到部署脚本中。

## ✅ 已修复的文件

### 1. `deployment/deploy-separated.sh`
- ✅ 修改了 `init_data_directories()` 函数
- ✅ 添加了 `verify_upload_permissions()` 函数
- ✅ 在部署流程中集成了权限验证

### 2. `deployment/init-data-dirs.sh`
- ✅ 优化了权限设置逻辑
- ✅ 专门为上传目录设置777权限
- ✅ 尝试设置容器用户所有者

## 🚀 部署方法

现在您只需要像往常一样运行部署脚本：

```bash
# 基础部署（推荐）
./deploy-separated.sh

# 或者带代理的部署
./deploy-separated.sh --proxy

# 更新现有部署
./deploy-separated.sh --update
```

## 🔧 修复内容

### 权限设置
部署脚本现在会自动：

1. **创建目录结构**：
   ```
   data/
   ├── logs/
   └── uploads/
       ├── contracts/
       ├── invoices/
       └── temp/
   ```

2. **设置正确权限**：
   - `data/logs/`: 755权限
   - `data/uploads/`: 777权限（确保容器可写）

3. **验证权限**：
   - 检查目录权限状态
   - 测试容器内文件创建权限
   - 显示权限验证结果

### 部署流程
```
检查Docker环境
    ↓
检查环境变量
    ↓
初始化数据目录 + 设置权限  ← 新增权限修复
    ↓
拉取最新镜像
    ↓
停止现有服务
    ↓
启动新服务
    ↓
检查服务状态
    ↓
验证上传权限  ← 新增权限验证
    ↓
显示访问信息
```

## 📋 验证结果

部署完成后，脚本会自动显示：

```
[INFO] 验证上传目录权限...
[INFO] 目录权限状态：
  drwxr-xr-x  data/logs
  drwxrwxrwx  data/uploads
[INFO] 测试容器内权限...
[SUCCESS] contracts目录权限正常
[SUCCESS] 文件创建权限正常
```

## 🧪 测试步骤

部署完成后，请测试上传功能：

1. **访问系统**: http://您的服务器IP:8000
2. **登录系统**: 使用您的账号登录
3. **进入详情页**: 打开任意合同或发票详情页
4. **上传附件**: 选择文件并上传
5. **验证结果**: 确认上传成功且可以预览

## 🔍 故障排除

如果部署后仍有权限问题：

### 查看部署日志
```bash
# 查看部署过程中的权限设置日志
./deploy-separated.sh --logs
```

### 手动验证权限
```bash
# 检查宿主机目录权限
ls -la deployment/data/
ls -la deployment/data/uploads/

# 检查容器内权限
docker exec contract-ledger-backend ls -la /app/uploads/
docker exec contract-ledger-backend whoami
```

### 手动修复（如果需要）
```bash
# 进入部署目录
cd deployment

# 重新设置权限
chmod -R 777 data/uploads/

# 重启容器
./deploy-separated.sh --update
```

## 📝 技术细节

### 权限问题原因
- 容器内运行的是 `midway` 用户（UID 1001）
- 宿主机目录权限不匹配导致无法创建子目录
- 需要777权限或正确的所有者设置

### 解决方案
- 自动设置777权限确保容器可写
- 尝试设置1001:1001所有者（如果有权限）
- 在部署流程中集成权限验证

### 安全考虑
- 777权限仅用于上传目录
- 日志目录使用755权限
- 生产环境建议使用防火墙限制访问

## 🎯 总结

现在您可以直接使用 `./deploy-separated.sh` 进行部署，脚本会自动：

1. ✅ 创建正确的目录结构
2. ✅ 设置适当的权限
3. ✅ 验证权限是否正确
4. ✅ 确保上传功能正常工作

不需要手动执行任何额外的权限修复脚本！
