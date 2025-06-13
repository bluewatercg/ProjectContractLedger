# 客户合同管理系统 - Midway版本

基于Midway框架重构的现代化客户合同管理系统，采用前后端分离架构。

## 🚀 快速部署 (推荐)

**使用GitHub Actions自动构建的Docker镜像，支持外部MySQL和Redis的一键部署方案。**

### 生产环境快速部署
```bash
# 1. 下载部署脚本
wget https://raw.githubusercontent.com/bluewatercg/projectcontractledger/main/deploy-simple.sh
chmod +x deploy-simple.sh

# 2. 初始化部署环境
./deploy-simple.sh --init

# 3. 配置数据库信息（编辑 .env.external-simple 文件）
# 填写MySQL和Redis连接信息

# 4. 启动服务
./deploy-simple.sh
```

**访问地址**: http://your-server-ip

详细部署指南: [快速部署指南.md](./快速部署指南.md) | [GitHub Actions部署指南](./docs/GitHub_Actions_部署指南.md)

---

## 技术栈

### 后端 (midway-backend)
- **框架**: Midway v3 + Koa
- **语言**: TypeScript
- **数据库**: MySQL + TypeORM
- **认证**: JWT
- **文档**: Swagger
- **验证**: @midwayjs/validate
- **日志**: @midwayjs/logger

### 前端 (midway-frontend)
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI组件**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP客户端**: Axios
- **图表**: ECharts

## 架构设计

### 前后端分离架构
```
┌─────────────────┐    HTTP/REST API    ┌─────────────────┐
│   前端应用       │ ◄─────────────────► │   后端服务       │
│  (Vue 3 SPA)    │                     │  (Midway API)   │
│  Port: 8000     │                     │  Port: 8080     │
└─────────────────┘                     └─────────────────┘
         │                                       │
         │                                       │
         ▼                                       ▼
┌─────────────────┐                     ┌─────────────────┐
│   浏览器存储     │                     │   MySQL数据库    │
│ (LocalStorage)  │                     │ (远程数据库)     │
└─────────────────┘                     └─────────────────┘
```

### 技术栈对应关系
| 层级 | 前端技术 | 后端技术 | 说明 |
|------|----------|----------|------|
| 表现层 | Vue 3 + Element Plus | - | 用户界面和交互 |
| 路由层 | Vue Router | Koa Router | 页面路由和API路由 |
| 状态层 | Pinia | - | 前端状态管理 |
| 业务层 | API调用 | Service层 | 业务逻辑处理 |
| 数据层 | Axios | TypeORM | 数据传输和持久化 |
| 认证层 | JWT Token | JWT中间件 | 用户认证和授权 |

## 项目结构

```
ProjectContractLedger/
├── midway-backend/          # 后端服务 (端口: 8080)
│   ├── src/
│   │   ├── controller/      # 控制器层 (API接口)
│   │   │   ├── auth.controller.ts      # 认证相关API
│   │   │   ├── customer.controller.ts  # 客户管理API
│   │   │   ├── contract.controller.ts  # 合同管理API
│   │   │   ├── invoice.controller.ts   # 发票管理API
│   │   │   ├── payment.controller.ts   # 支付管理API
│   │   │   └── statistics.controller.ts # 统计分析API
│   │   ├── service/         # 服务层 (业务逻辑)
│   │   ├── entity/          # 数据实体 (数据库模型)
│   │   ├── middleware/      # 中间件 (认证、CORS、日志)
│   │   ├── filter/          # 异常过滤器
│   │   ├── config/          # 配置文件 (数据库、JWT等)
│   │   ├── interface.ts     # 类型定义
│   │   └── configuration.ts # 主配置文件
│   ├── dist/               # 编译输出目录
│   ├── logs/               # 日志文件
│   ├── test/               # 测试文件
│   ├── bootstrap.js        # 生产环境启动文件
│   ├── package.json        # 后端依赖配置
│   ├── tsconfig.json       # TypeScript配置
│   └── yarn.lock           # Yarn锁定文件
├── midway-frontend/         # 前端应用 (端口: 8000)
│   ├── src/
│   │   ├── api/             # API接口层
│   │   │   ├── config.ts           # Axios配置和拦截器
│   │   │   ├── auth.ts             # 认证API
│   │   │   ├── customer.ts         # 客户API
│   │   │   ├── contract.ts         # 合同API
│   │   │   ├── invoice.ts          # 发票API
│   │   │   ├── payment.ts          # 支付API
│   │   │   ├── statistics.ts       # 统计API
│   │   │   └── types.ts            # API类型定义
│   │   ├── views/           # 页面组件
│   │   │   ├── customers/          # 客户管理页面
│   │   │   ├── contracts/          # 合同管理页面
│   │   │   ├── invoices/           # 发票管理页面
│   │   │   ├── payments/           # 支付管理页面
│   │   │   ├── Dashboard.vue       # 仪表板
│   │   │   └── Login.vue           # 登录页
│   │   ├── stores/          # 状态管理 (Pinia)
│   │   ├── router/          # 路由配置
│   │   ├── styles/          # 样式文件
│   │   ├── App.vue          # 根组件
│   │   └── main.ts          # 应用入口
│   ├── dist/               # 构建输出目录
│   ├── index.html          # HTML模板
│   ├── vite.config.ts      # Vite配置
│   ├── package.json        # 前端依赖配置
│   ├── tsconfig.json       # TypeScript配置
│   └── yarn.lock           # Yarn锁定文件
├── database/               # 数据库相关
│   ├── scripts/            # SQL脚本
│   └── diagrams/           # 数据库设计图
├── docs/                   # 项目文档
├── start-dev.bat          # Windows启动脚本
├── start-dev.sh           # Linux/Mac启动脚本
├── package.json           # 根目录配置
└── README-MIDWAY.md       # 项目文档
```

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 5.7
- Yarn >= 1.22.0 (推荐) 或 npm >= 8.0.0

### 1. 安装依赖

#### 方式一：使用根目录脚本 (推荐)
```bash
# 自动安装所有依赖
yarn install-all
# 或
npm run install-all
```

#### 方式二：手动安装
```bash
# 安装后端依赖
cd midway-backend
yarn install
# 或 npm install

# 安装前端依赖
cd ../midway-frontend
yarn install
# 或 npm install
```

### 2. 配置数据库

数据库已预配置为远程MySQL数据库，无需额外配置。

数据库信息：
- **主机**: mysql.sqlpub.com:3306
- **数据库**: procontractledger
- **用户**: millerchen
- **密码**: c3TyBrus2OmLeeIu

### 环境配置说明

系统支持多环境配置，根据不同环境使用不同的配置文件：

#### 开发环境 (NODE_ENV=local)
```bash
cp .env.local.template .env.local
```

#### 测试环境 (NODE_ENV=unittest)
```bash
cp .env.unittest.template .env.unittest
```

#### 生产环境 (NODE_ENV=production)
```bash
cp .env.external-simple.template .env.external-simple
```

编辑对应的环境配置文件：
```env
# 环境标识
NODE_ENV=local

# 数据库配置
DB_HOST=mysql.sqlpub.com
DB_PORT=3306
DB_USERNAME=millerchen
DB_PASSWORD=c3TyBrus2OmLeeIu
DB_DATABASE=procontractledger

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
```

**配置说明**：
- 不同环境使用相同的配置结构
- 只需要修改数据库连接信息和环境标志
- 测试环境建议使用独立的数据库名称（如 `contract_ledger_test`）
- 测试环境可以使用不同的Redis数据库编号（如 `REDIS_DB=1`）

### 3. 启动服务

#### 方式一：使用启动脚本
```bash
# Windows
start-dev.bat

# Linux/Mac
chmod +x start-dev.sh
./start-dev.sh
```

#### 方式二：手动启动
```bash
# 启动后端服务
cd midway-backend
yarn dev
# 或 npm run dev

# 启动前端服务（新终端）
cd midway-frontend
yarn dev
# 或 npm run dev
```

#### 方式三：使用根目录脚本
```bash
# 同时启动前后端服务
yarn dev
# 或 npm run dev
```

### 4. 访问应用

- 前端应用: http://localhost:8000
- 后端API: http://localhost:8080
- API文档: http://localhost:8080/api-docs

### 5. 默认登录账户

- **用户名**: admin
- **密码**: admin123
- **角色**: 管理员

### 6. 代码格式化

在提交代码前，建议运行格式化脚本：
```bash
# Linux/Mac
chmod +x fix-format.sh
./fix-format.sh

# Windows
fix-format.bat
```

### 7. 测试API

运行API测试脚本验证后端服务：
```bash
# 在根目录执行
yarn test-api
# 或 npm run test-api
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
- ✅ TypeScript全栈开发
- ✅ 依赖注入与IoC容器 (Midway)
- ✅ 自动API文档生成 (Swagger)
- ✅ 统一异常处理和过滤器
- ✅ 请求参数验证 (@midwayjs/validate)
- ✅ JWT认证中间件
- ✅ CORS跨域支持
- ✅ 分页查询支持
- ✅ 响应式UI设计 (Element Plus)
- ✅ 状态管理 (Pinia)
- ✅ 路由守卫和权限控制
- ✅ HTTP请求拦截和错误处理
- ✅ 热重载开发环境
- ✅ TypeORM数据库操作
- ✅ 环境配置管理

## API接口

### 认证相关
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/refresh` - 刷新Token

### 客户管理
- `GET /api/v1/customers` - 获取客户列表
- `POST /api/v1/customers` - 创建客户
- `GET /api/v1/customers/:id` - 获取客户详情
- `PUT /api/v1/customers/:id` - 更新客户
- `DELETE /api/v1/customers/:id` - 删除客户

### 合同管理
- `GET /api/v1/contracts` - 获取合同列表
- `POST /api/v1/contracts` - 创建合同
- `GET /api/v1/contracts/:id` - 获取合同详情
- `PUT /api/v1/contracts/:id` - 更新合同
- `DELETE /api/v1/contracts/:id` - 删除合同

### 发票管理
- `GET /api/v1/invoices` - 获取发票列表
- `POST /api/v1/invoices` - 创建发票
- `GET /api/v1/invoices/:id` - 获取发票详情
- `PUT /api/v1/invoices/:id` - 更新发票
- `DELETE /api/v1/invoices/:id` - 删除发票

### 支付管理
- `GET /api/v1/payments` - 获取支付记录
- `POST /api/v1/payments` - 创建支付记录
- `GET /api/v1/payments/:id` - 获取支付详情
- `PUT /api/v1/payments/:id` - 更新支付记录
- `DELETE /api/v1/payments/:id` - 删除支付记录

### 统计分析
- `GET /api/v1/statistics/dashboard` - 仪表板统计
- `GET /api/v1/statistics/revenue/trend` - 收入趋势
- `GET /api/v1/statistics/customers/distribution` - 客户分布

## 开发指南

### 后端开发

#### 添加新的API接口
1. 在 `src/entity/` 中定义数据实体
2. 在 `src/service/` 中实现业务逻辑
3. 在 `src/controller/` 中定义API接口
4. 在 `src/interface.ts` 中添加类型定义

#### 中间件开发
```typescript
import { Middleware, IMiddleware } from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';

@Middleware()
export class CustomMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      // 中间件逻辑
      await next();
    };
  }
}
```

### 前端开发

#### 添加新页面
1. 在 `src/views/` 中创建Vue组件
2. 在 `src/router/index.ts` 中添加路由
3. 在 `src/api/` 中定义API接口

#### 状态管理
```typescript
import { defineStore } from 'pinia'

export const useExampleStore = defineStore('example', () => {
  const state = ref('')
  
  const actions = {
    // 定义actions
  }
  
  return { state, ...actions }
})
```

## 部署指南

### 生产环境部署

1. 构建前端应用：
```bash
cd midway-frontend
yarn build
# 或 npm run build
```

2. 构建后端应用：
```bash
cd midway-backend
yarn build
# 或 npm run build
```

3. 启动生产服务：
```bash
cd midway-backend
yarn start
# 或 npm start
```

#### 使用根目录脚本构建
```bash
# 同时构建前后端
yarn build-all
# 或 npm run build-all
```

### Docker部署

```dockerfile
# Dockerfile示例
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080
CMD ["npm", "start"]
```

## 常见问题

### 1. 数据库连接失败
- 检查MySQL服务是否启动
- 确认数据库配置信息正确
- 检查防火墙设置

### 2. 前端API请求失败
- 确认后端服务已启动
- 检查CORS配置
- 验证API地址配置

### 3. JWT Token过期
- 检查token有效期配置
- 实现token自动刷新机制

### 4. 依赖安装失败
- 清理缓存：`yarn cache clean` 或 `npm cache clean --force`
- 删除 node_modules 重新安装
- 检查网络连接和镜像源配置

### 5. 编译错误
- 检查 TypeScript 版本兼容性
- 确认所有依赖已正确安装
- 查看具体错误信息并修复类型问题

### 6. 端口占用
- 检查端口 8000 和 8080 是否被占用
- 使用 `netstat -ano | findstr :8080` (Windows) 查看端口占用
- 修改配置文件中的端口号

### 7. 数据库同步问题
- 检查数据库连接配置
- 确认数据库表结构是否正确
- 查看 TypeORM 同步日志

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 更新日志

### v1.1.0 (2024-12-19)
- ✅ 优化项目结构和文档
- ✅ 修复循环依赖问题
- ✅ 统一包管理器使用 (Yarn)
- ✅ 完善启动脚本和配置
- ✅ 增强错误处理和故障排除指南
- ✅ 更新架构设计说明

### v1.0.0 (2024-01-01)
- ✅ 完成Midway框架重构
- ✅ 实现前后端分离架构
- ✅ 添加TypeScript支持
- ✅ 集成Element Plus UI组件库
- ✅ 实现JWT认证机制
- ✅ 添加API文档自动生成
