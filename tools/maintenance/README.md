# 🔧 维护工具

> **最新更新**: 2025-08-26  
> **维护状态**: ✅ 活跃维护  
> **兼容版本**: v2.2.0+

本目录包含系统维护、调试和修复相关的脚本，为系统稳定运行提供支持。

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

## 🔗 相关文档

- [📚 **项目文档中心**](../../docs/README.md) - 完整的文档导航
- [🔧 **故障排除**](../../docs/TROUBLESHOOTING.md) - 常见问题解决方案
- [🐳 **Docker工具**](../docker/) - Docker部署和管理工具
- [💾 **备份工具**](../backup/) - 系统备份和恢复方案
- [🧪 **测试工具**](../../testing/) - 自动化测试和质量保障

### 🔄 最新更新 (v2.2.0 - 2025-08-26)
- ✅ **Docker调试**: 增强容器环境调试和问题诊断功能
- ✅ **环境检查**: 优化环境变量和配置文件检查
- ✅ **数据库诊断**: 加强数据库连接和性能诊断
- ✅ **上传修复**: 完善文件上传问题诊断和修复

---

**ProjectContractLedger Maintenance Tools** - 保障系统稳定，快速解决问题！

> 📝 建议在生产环境中定期运行检查脚本，及时发现和解决潜在问题。

**文档版本**: v2.2.0  
**最后更新**: 2025-08-26  
**维护状态**: ✅ 活跃维护