# 维护工具

本目录包含系统维护、调试和修复相关的脚本。

## 📋 脚本说明

### 🔧 修复脚本
- **`fix-contract-upload-issue.sh`** - 修复合同附件上传问题
- **`fix-upload-issue.sh`** - 通用文件上传问题修复

### 🔍 调试脚本
- **`debug-database-connection.sh`** - 数据库连接诊断
- **`debug-container-upload.sh`** - 容器上传功能调试
- **`debug-upload-issue.js`** - JavaScript上传问题调试

### 📊 检查脚本
- **`check-docker-env.sh`** - 检查Docker环境变量和配置
- **`check-env-path.sh`** - 检查.env文件路径

## 🚀 使用方法

### 修复上传问题
```bash
cd tools/maintenance
./fix-contract-upload-issue.sh
```

### 诊断数据库连接
```bash
cd tools/maintenance
./debug-database-connection.sh
```

### 检查Docker环境
```bash
cd tools/maintenance
./check-docker-env.sh
```

### 检查配置文件路径
```bash
cd tools/maintenance
./check-env-path.sh
```

## 🎯 常见问题解决

### 文件上传问题
1. 运行 `fix-contract-upload-issue.sh`
2. 检查Docker卷挂载权限
3. 验证容器内目录权限

### 数据库连接问题
1. 运行 `debug-database-connection.sh`
2. 检查网络连通性
3. 验证用户权限和密码

### 环境配置问题
1. 运行 `check-env-path.sh`
2. 检查.env文件位置
3. 验证环境变量加载

## ⚠️ 注意事项

1. **备份数据**：修复前建议先备份重要数据
2. **测试环境**：建议先在测试环境验证修复效果
3. **权限要求**：某些脚本需要sudo权限
4. **日志记录**：注意查看脚本执行日志