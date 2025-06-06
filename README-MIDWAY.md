# 客户合同管理系统 - Midway版本

基于Midway框架重构的现代化客户合同管理系统，采用前后端分离架构。

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

## 项目结构

```
ProjectContractLedger/
├── midway-backend/          # 后端服务
│   ├── src/
│   │   ├── controller/      # 控制器
│   │   ├── service/         # 服务层
│   │   ├── entity/          # 数据实体
│   │   ├── middleware/      # 中间件
│   │   ├── filter/          # 异常过滤器
│   │   ├── config/          # 配置文件
│   │   └── interface.ts     # 类型定义
│   ├── .env                 # 环境变量
│   └── package.json
├── midway-frontend/         # 前端应用
│   ├── src/
│   │   ├── api/             # API接口
│   │   ├── components/      # 组件
│   │   ├── views/           # 页面
│   │   ├── stores/          # 状态管理
│   │   ├── router/          # 路由配置
│   │   └── styles/          # 样式文件
│   ├── .env                 # 环境变量
│   └── package.json
├── start-dev.bat           # Windows启动脚本
├── start-dev.sh            # Linux/Mac启动脚本
└── README-MIDWAY.md        # 项目文档
```

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 5.7
- npm >= 8.0.0

### 1. 安装依赖

```bash
# 安装后端依赖
cd midway-backend
npm install

# 安装前端依赖
cd ../midway-frontend
npm install
```

### 2. 配置数据库

数据库已预配置为远程MySQL数据库，无需额外配置。

数据库信息：
- **主机**: mysql.sqlpub.com:3306
- **数据库**: procontractledger
- **用户**: millerchen
- **密码**: c3TyBrus2OmLeeIu

如需修改数据库配置，请编辑 `midway-backend/.env` 文件：
```env
DB_HOST=mysql.sqlpub.com
DB_PORT=3306
DB_USERNAME=millerchen
DB_PASSWORD=c3TyBrus2OmLeeIu
DB_DATABASE=procontractledger
JWT_SECRET=your-super-secret-jwt-key
```

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
npm run dev

# 启动前端服务（新终端）
cd midway-frontend
npm run dev
```

### 4. 访问应用

- 前端应用: http://localhost:8000
- 后端API: http://localhost:8080
- API文档: http://localhost:8080/api-docs

### 5. 默认登录账户

- **用户名**: admin
- **密码**: admin123
- **角色**: 管理员

### 6. 测试API

运行API测试脚本验证后端服务：
```bash
npm install axios
npm run test-api
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
- ✅ 依赖注入与IoC容器
- ✅ 自动API文档生成
- ✅ 统一异常处理
- ✅ 请求参数验证
- ✅ JWT认证中间件
- ✅ CORS跨域支持
- ✅ 分页查询支持
- ✅ 响应式UI设计

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
npm run build
```

2. 构建后端应用：
```bash
cd midway-backend
npm run build
```

3. 启动生产服务：
```bash
cd midway-backend
npm start
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

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 更新日志

### v1.0.0 (2024-01-01)
- ✅ 完成Midway框架重构
- ✅ 实现前后端分离架构
- ✅ 添加TypeScript支持
- ✅ 集成Element Plus UI组件库
- ✅ 实现JWT认证机制
- ✅ 添加API文档自动生成
