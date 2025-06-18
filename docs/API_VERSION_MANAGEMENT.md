# API版本管理指南

本文档介绍如何在项目中实现动态API版本管理，支持v1、v2、v3...vX等任意版本，无需硬编码版本号。

## 🎯 设计目标

- ✅ **零代码修改升级** - 前端代码无需修改，仅通过配置升级
- ✅ **动态版本支持** - 支持任意版本号（v1, v2, v3, v4...vX）
- ✅ **向后兼容** - 新版本自动包含旧版本功能
- ✅ **渐进式升级** - 可以逐步升级，支持回滚
- ✅ **多版本并存** - 不同版本API可以同时运行

## 🏗️ 架构设计

### 前端版本管理

#### 1. 动态版本检测
```typescript
// apps/frontend/src/api/version.ts
export const getCurrentApiVersion = (): string => {
  // 自动从多个来源检测版本：
  // 1. 运行时配置 (window.__APP_CONFIG__.API_VERSION)
  // 2. 环境变量 (VITE_API_VERSION)
  // 3. URL提取 (/api/v2/xxx -> v2)
  // 4. 默认版本 (v1)
}
```

#### 2. 智能URL构建
```typescript
// 自动构建正确的API Base URL
export const buildApiBaseUrl = (): string => {
  // 根据版本自动生成: /api/v1, /api/v2, /api/v3...
}
```

#### 3. 功能兼容性检查
```typescript
// 检查功能是否在当前版本可用
export const isFeatureAvailable = (feature: string): boolean => {
  // v1: 基础功能
  // v2: + 附件、通知
  // v3: + 报表、分析、Webhooks
  // v4: + AI洞察、自动化
  // v5: + 移动API、实时功能
}
```

### 后端版本管理

#### 1. 版本化控制器基类
```typescript
// apps/backend/src/controller/base/versioned.controller.ts
export abstract class VersionedController {
  protected getApiVersion(): string // 从路由提取版本
  protected createVersionedResponse() // 版本化响应格式
  protected isFeatureAvailable() // 功能可用性检查
}
```

#### 2. 动态控制器创建
```typescript
// 支持任意版本的控制器
@createVersionedController('v3', '/auth')  // 可以是v1,v2,v3...vX
export class AuthController extends VersionedController {
  // 自动适配版本功能
}
```

## 🚀 使用方法

### 版本升级

#### 方法一：使用升级脚本（推荐）
```bash
# 检查当前版本
./upgrade-api-version.sh --check

# 升级到任意版本
./upgrade-api-version.sh --upgrade v3
./upgrade-api-version.sh --upgrade v5
./upgrade-api-version.sh --upgrade v10  # 支持任意版本

# 列出可用版本
./upgrade-api-version.sh --list

# 回滚到上一版本
./upgrade-api-version.sh --rollback
```

#### 方法二：修改配置文件
```bash
# 编辑 .env 文件
API_VERSION=v3                    # 目标版本
FRONTEND_API_BASE_URL=/api/v3     # 自动更新
LATEST_API_VERSION=v3             # 最新版本

# 重启服务
./deploy-separated.sh --update
```

### 添加新版本

#### 1. 后端添加新版本控制器
```typescript
// 创建v4版本的认证控制器
@createVersionedController('v4', '/auth')
export class AuthV4Controller extends VersionedController {
  @Post('/login')
  async login(@Body() loginDto: LoginDto) {
    // v4特有功能
    if (this.isFeatureAvailable('ai-insights')) {
      // 添加AI洞察功能
    }
    
    return this.createVersionedResponse(result, '登录成功');
  }
}
```

#### 2. 前端自动适配
```typescript
// 前端代码无需修改，自动路由到正确版本
authApi.login(data)  // 自动使用 /api/v4/auth/login
```

#### 3. 功能定义
```typescript
// 在 version.ts 中添加新版本功能
const getVersionFeatures = (version: string): string[] => {
  const additionalFeatures: Record<number, string[]> = {
    4: ['ai-insights', 'automation', 'integrations'],  // 新增v4功能
    5: ['mobile-api', 'real-time', 'advanced-search']  // 新增v5功能
  }
  // 自动累积功能（向后兼容）
}
```

## 📋 版本功能规划

| 版本 | 新增功能 | 累积功能 |
|------|----------|----------|
| v1 | 认证、客户、合同、发票、支付、统计 | 基础功能 |
| v2 | 附件管理、通知系统 | v1 + v2功能 |
| v3 | 报表、分析、Webhooks | v1 + v2 + v3功能 |
| v4 | AI洞察、自动化、集成 | v1-v4所有功能 |
| v5 | 移动API、实时功能、高级搜索 | v1-v5所有功能 |
| vX | 任意新功能... | 向后兼容所有功能 |

## 🔧 配置说明

### 环境变量配置
```bash
# 基础版本配置
API_VERSION=v3                           # 当前使用版本
FRONTEND_API_BASE_URL=/api/v3            # 前端API地址
LATEST_API_VERSION=v5                    # 最新可用版本

# 兼容性配置
MIN_SUPPORTED_VERSION=v1                 # 最低支持版本
DEPRECATED_VERSION_THRESHOLD=v2          # 弃用警告阈值
```

### 运行时配置
```javascript
// 容器启动时注入的配置
window.__APP_CONFIG__ = {
  API_VERSION: 'v3',
  API_BASE_URL: '/api/v3',
  LATEST_API_VERSION: 'v5'
}
```

## 🎯 最佳实践

### 1. 版本命名规范
- 使用语义化版本：`v1`, `v2`, `v3`...
- 支持子版本：`v2.1`, `v2.2`（可选）
- 保持简洁：避免复杂的版本号

### 2. 功能设计原则
- **向后兼容**：新版本包含所有旧版本功能
- **渐进增强**：每个版本添加有限的新功能
- **优雅降级**：旧版本客户端仍能正常工作

### 3. 升级策略
- **测试环境先行**：在测试环境验证新版本
- **灰度发布**：逐步切换到新版本
- **监控告警**：监控版本切换后的系统状态
- **快速回滚**：出现问题时快速回滚到稳定版本

### 4. 文档维护
- **版本变更日志**：记录每个版本的变更
- **迁移指南**：提供版本升级指导
- **兼容性矩阵**：明确版本间的兼容关系

## 🚨 注意事项

1. **数据库兼容性**：确保数据库结构支持新版本功能
2. **缓存清理**：版本升级后清理相关缓存
3. **监控告警**：设置版本切换的监控和告警
4. **回滚准备**：始终准备好快速回滚方案

## 📞 故障排除

### 常见问题

1. **Q: 升级后前端仍然调用旧版本API**
   A: 检查浏览器缓存，清除缓存或硬刷新

2. **Q: 新版本功能不可用**
   A: 检查后端是否部署了对应版本的控制器

3. **Q: 版本检测不正确**
   A: 检查环境变量配置和运行时配置注入

4. **Q: 如何支持更高版本（如v10）**
   A: 系统自动支持任意版本号，只需更新配置即可

## 🎉 总结

通过这套动态版本管理系统，您可以：

- ✅ **无缝升级**：从v1升级到任意版本（v2, v3, v4...vX）
- ✅ **零代码修改**：前端代码完全不需要修改
- ✅ **灵活配置**：通过环境变量控制版本
- ✅ **向后兼容**：新版本自动包含旧版本功能
- ✅ **快速回滚**：出现问题可立即回滚

这样的设计确保了API版本管理的灵活性和可扩展性，无论未来需要升级到v10还是v100，都可以通过简单的配置变更实现！
