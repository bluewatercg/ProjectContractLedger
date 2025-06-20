# 附件预览404问题修复总结

## 🐛 问题描述

昨天更新实体类和API注解后，附件上传成功但预览失败，显示404错误。

## 🔍 问题分析

经过分析，发现问题的根本原因是：

1. **运行时配置缺失**: 前端`index.html`没有引用运行时配置文件`config.js`
2. **API基础URL硬编码**: 前端AttachmentList.vue中预览URL硬编码为`/api/v1/`
3. **版本管理系统**: 昨天添加的API版本管理系统需要运行时配置支持

## ✅ 修复方案

### 1. 前端index.html修复

**修复前**:
```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>客户合同管理系统</title>
</head>
```

**修复后**:
```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>客户合同管理系统</title>
  <!-- 运行时配置 - 在容器启动时动态生成 -->
  <script src="/config.js"></script>
</head>
```

### 2. AttachmentList.vue修复

**修复前**:
```javascript
const previewFile = (attachment: Attachment) => {
  previewFileData.value = attachment
  previewType.value = isPdf(attachment.file_name) ? 'pdf' : 'image'

  // 为预览URL添加认证token
  const token = localStorage.getItem('token')
  previewUrl.value = `/api/v1/attachments/${attachment.attachment_id}/download?token=${token}`
  previewVisible.value = true
}
```

**修复后**:
```javascript
import { attachmentApi } from '@/api/attachment'

const previewFile = (attachment: Attachment) => {
  previewFileData.value = attachment
  previewType.value = isPdf(attachment.file_name) ? 'pdf' : 'image'

  // 使用API模块的预览URL生成方法，确保使用正确的基础URL
  previewUrl.value = attachmentApi.getAttachmentPreviewUrl(attachment.attachment_id)
  previewVisible.value = true
}
```

## 📋 修复文件清单

### 已修改的文件
- ✅ `apps/frontend/index.html` - 添加运行时配置引用
- ✅ `apps/frontend/src/components/AttachmentList.vue` - 修复预览URL生成逻辑
- ✅ `scripts/fix-attachment-preview.sh` - 自动修复脚本

## 🚀 部署修复

### 方法1：使用修复脚本（推荐）
```bash
# 运行修复脚本
./scripts/fix-attachment-preview.sh
```

### 方法2：手动修复
```bash
# 1. 重新构建前端镜像
cd apps/frontend
docker build -t ghcr.io/bluewatercg/projectcontractledger-frontend:fixed .

# 2. 停止现有前端容器
docker stop contract-ledger-frontend
docker rm contract-ledger-frontend

# 3. 更新镜像标签
docker tag ghcr.io/bluewatercg/projectcontractledger-frontend:fixed ghcr.io/bluewatercg/projectcontractledger-frontend:latest

# 4. 重新启动容器
cd ../../deployment
docker-compose up -d frontend
```

## 🔧 技术原理

### 运行时配置系统
前端容器启动时，`start.sh`脚本会生成`/usr/share/nginx/html/config.js`文件：

```javascript
window.__APP_CONFIG__ = {
  API_VERSION: 'v1',
  API_BASE_URL: '/api/v1',
  BACKEND_HOST: '192.168.1.115',
  BACKEND_PORT: '8080',
  // ... 其他配置
};
```

### API版本管理
前端的`version.ts`模块会读取运行时配置：

```javascript
const getRuntimeConfig = () => {
  if (typeof window !== 'undefined' && (window as any).__APP_CONFIG__) {
    return (window as any).__APP_CONFIG__
  }
  return {}
}

export const buildApiBaseUrl = (): string => {
  const runtimeConfig = getRuntimeConfig()
  
  // 优先使用运行时配置
  if (runtimeConfig.API_BASE_URL) {
    return runtimeConfig.API_BASE_URL
  }
  
  // 其他fallback逻辑...
}
```

## 🧪 测试验证

修复完成后，请按以下步骤测试：

1. **登录系统**: 访问 http://localhost:8000
2. **进入详情页**: 打开任意合同或发票详情页
3. **上传附件**: 上传一个PDF或图片文件
4. **测试预览**: 点击预览按钮，确认能正常显示

## 🔍 故障排除

如果修复后仍有问题，请检查：

### 1. 检查运行时配置
```bash
# 查看配置文件是否存在
docker exec contract-ledger-frontend ls -la /usr/share/nginx/html/config.js

# 查看配置文件内容
docker exec contract-ledger-frontend cat /usr/share/nginx/html/config.js
```

### 2. 检查容器日志
```bash
# 前端容器日志
docker logs contract-ledger-frontend

# 后端容器日志
docker logs contract-ledger-backend
```

### 3. 检查网络连接
```bash
# 测试前端到后端的连接
docker exec contract-ledger-frontend wget --spider http://192.168.1.115:8080/health
```

## 📝 预防措施

为避免类似问题再次发生：

1. **运行时配置**: 确保所有动态配置都通过运行时注入
2. **API版本管理**: 使用统一的版本管理系统，避免硬编码
3. **测试覆盖**: 在修改API或实体类后，及时测试前端功能
4. **文档更新**: 及时更新部署和配置文档

## 🎯 总结

此次问题主要由于前端缺少运行时配置引用导致，通过添加`config.js`引用和修复预览URL生成逻辑，问题已得到解决。修复后的系统能够正确处理API版本管理和动态配置，提高了系统的灵活性和可维护性。
