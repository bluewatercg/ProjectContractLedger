# 客户合同管理系统 - 前端应用

基于 Vue 3 + TypeScript + Vite 开发的现代化前端应用。

## 技术栈

- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI组件**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP客户端**: Axios
- **图表**: ECharts

## 快速开始

### 开发环境

```bash
# 安装依赖
yarn install

# 启动开发服务器
yarn dev

# 访问应用
open http://localhost:8000
```

### 生产构建

```bash
# 构建生产版本
yarn build

# 预览构建结果
yarn preview

# 使用 http-server 服务静态文件
yarn serve
```

## 可用脚本

- `yarn dev` - 启动开发服务器 (端口: 8000)
- `yarn build` - 构建生产版本
- `yarn preview` - 预览构建结果
- `yarn serve` - 使用 http-server 服务静态文件
- `yarn lint` - 代码风格检查

## 项目结构

```
src/
├── api/                 # API接口层
│   ├── config.ts           # Axios配置和拦截器
│   ├── auth.ts             # 认证API
│   ├── customer.ts         # 客户API
│   ├── contract.ts         # 合同API
│   ├── invoice.ts          # 发票API
│   ├── payment.ts          # 支付API
│   ├── statistics.ts       # 统计API
│   └── types.ts            # API类型定义
├── views/               # 页面组件
│   ├── customers/          # 客户管理页面
│   ├── contracts/          # 合同管理页面
│   ├── invoices/           # 发票管理页面
│   ├── payments/           # 支付管理页面
│   ├── Dashboard.vue       # 仪表板
│   └── Login.vue           # 登录页
├── stores/              # 状态管理 (Pinia)
│   ├── auth.ts             # 认证状态
│   └── index.ts            # Store配置
├── router/              # 路由配置
│   └── index.ts            # 路由定义和守卫
├── styles/              # 样式文件
│   └── index.css           # 全局样式
├── App.vue              # 根组件
└── main.ts              # 应用入口
```

## 功能特性

### 核心功能
- ✅ 用户认证与授权
- ✅ 客户信息管理
- ✅ 合同生命周期管理
- ✅ 发票开具与跟踪
- ✅ 支付记录管理
- ✅ 数据统计与分析

### 技术特性
- ✅ TypeScript 类型安全
- ✅ 响应式设计
- ✅ 组件化开发
- ✅ 状态管理 (Pinia)
- ✅ 路由守卫和权限控制
- ✅ HTTP请求拦截和错误处理
- ✅ 自动导入 (unplugin-auto-import)
- ✅ 组件自动注册 (unplugin-vue-components)
- ✅ 热重载开发环境

## 配置说明

### 环境变量

创建 `.env.local` 文件进行本地配置：

```env
# API基础地址
VITE_API_BASE_URL=http://localhost:8080/api/v1

# 应用标题
VITE_APP_TITLE=客户合同管理系统

# 应用版本
VITE_APP_VERSION=1.0.0
```

### Vite 配置

主要配置项在 `vite.config.ts` 中：

- **端口**: 8000
- **代理**: `/api` 请求代理到后端服务
- **别名**: `@` 指向 `src` 目录
- **自动导入**: Vue、Vue Router、Pinia
- **组件自动注册**: Element Plus

## 开发指南

### 添加新页面

1. 在 `src/views/` 中创建 Vue 组件
2. 在 `src/router/index.ts` 中添加路由
3. 在 `src/api/` 中定义相关 API 接口

### 状态管理

使用 Pinia 进行状态管理：

```typescript
import { defineStore } from 'pinia'

export const useExampleStore = defineStore('example', () => {
  const state = ref('')
  
  const actions = {
    // 定义 actions
  }
  
  return { state, ...actions }
})
```

### API 调用

所有 API 调用都通过 `src/api/` 目录中的模块进行：

```typescript
import { customerApi } from '@/api'

// 获取客户列表
const customers = await customerApi.getCustomers({ page: 1, limit: 10 })
```

## 部署

### 构建优化

- 代码分割和懒加载
- 静态资源压缩
- Tree-shaking 优化
- 生产环境去除调试信息

### 部署到静态服务器

```bash
# 构建
yarn build

# 部署 dist 目录到静态服务器
# 如 Nginx、Apache、CDN 等
```

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 许可证

MIT License
