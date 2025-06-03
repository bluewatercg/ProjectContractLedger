# 客户合同管理系统 - 后端API服务

## 概述

这是客户合同管理系统的后端API服务，基于Node.js和Express.js开发，使用MySQL作为数据库。API设计遵循RESTful风格，实现了客户、合同、发票、付款、用户和客户开票信息管理功能。

## 目录结构

```
├── config/           # 配置文件
│   ├── database.js   # 数据库配置
│   └── config.js     # 应用配置
├── controllers/      # 控制器
│   ├── authController.js        # 认证控制器
│   ├── customerController.js    # 客户控制器
│   ├── contractController.js    # 合同控制器
│   ├── invoiceController.js     # 发票控制器
│   ├── paymentController.js     # 付款控制器
│   ├── statisticsController.js  # 数据统计控制器
│   └── userController.js        # 用户管理控制器
├── middleware/       # 中间件
│   └── authMiddleware.js        # 认证中间件
├── models/           # 数据模型
│   ├── userModel.js
│   ├── customerModel.js
│   ├── contractModel.js
│   ├── invoiceModel.js
│   └── paymentModel.js
├── routes/           # 路由定义
│   ├── authRoutes.js            # 认证路由
│   ├── customerRoutes.js        # 客户路由
│   ├── contractRoutes.js        # 合同路由
│   ├── invoiceRoutes.js         # 发票路由
│   ├── paymentRoutes.js         # 付款路由
│   ├── statisticsRoutes.js      # 数据统计路由
│   └── userRoutes.js            # 用户管理路由
├── utils/            # 工具函数
│   ├── errorHandler.js
│   ├── jwtHelper.js
│   └── validators.js
├── app.js            # 应用入口
├── server.js         # 服务器启动文件
├── package.json      # 依赖配置
├── generateHash.js   # 密码哈希生成工具
└── README.md         # 说明文档
```

## 技术栈

- Node.js v16+
- Express.js v4.18+
- MySQL v8.0+
- mysql2 (MySQL客户端)
- jsonwebtoken (JWT认证)
- dotenv (环境变量管理)
- cors (跨域资源共享)
- morgan (HTTP请求日志)
- swagger-ui-express (API文档展示)
- yamljs (YAML文件解析)

## API参考

本API服务实现了以下功能模块：

### 认证 (Authentication)

- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh` - 刷新令牌

### 用户管理 (Users)

- `GET /api/v1/users` - 获取所有用户
- `GET /api/v1/users/:id` - 获取单个用户
- `POST /api/v1/users` - 创建用户
- `PUT /api/v1/users/:id` - 更新用户
- `DELETE /api/v1/users/:id` - 删除用户

### 客户管理 (Customers)

- `GET /api/v1/customers` - 获取所有客户
- `GET /api/v1/customers/:customerId` - 获取单个客户
- `POST /api/v1/customers` - 创建客户
- `PUT /api/v1/customers/:customerId` - 更新客户
- `DELETE /api/v1/customers/:customerId` - 删除客户

### 客户开票信息 (InvoiceInfos)

- `GET /api/v1/customers/:customerId/invoice-infos` - 获取客户开票信息列表
- `POST /api/v1/customers/:customerId/invoice-infos` - 创建客户开票信息
- `PUT /api/v1/customers/:customerId/invoice-infos/:infoId` - 更新客户开票信息
- `DELETE /api/v1/customers/:customerId/invoice-infos/:infoId` - 删除客户开票信息

### 合同管理 (Contracts)

- `GET /api/v1/contracts` - 获取所有合同
- `GET /api/v1/contracts/:contractId` - 获取单个合同
- `POST /api/v1/contracts` - 创建合同
- `PUT /api/v1/contracts/:contractId` - 更新合同
- `DELETE /api/v1/contracts/:contractId` - 删除合同

### 发票管理 (Invoices)

- `GET /api/v1/invoices` - 获取所有发票
- `GET /api/v1/invoices/:invoiceId` - 获取单个发票
- `POST /api/v1/invoices` - 创建发票
- `PUT /api/v1/invoices/:invoiceId` - 更新发票
- `DELETE /api/v1/invoices/:invoiceId` - 删除发票

### 付款管理 (Payments)

- `GET /api/v1/payments` - 获取所有付款记录
- `GET /api/v1/payments/:paymentId` - 获取单个付款记录
- `POST /api/v1/payments` - 创建付款记录
- `PUT /api/v1/payments/:paymentId` - 更新付款记录
- `DELETE /api/v1/payments/:paymentId` - 删除付款记录

### 数据统计 (Statistics)

- `GET /api/v1/statistics/contracts/amount` - 获取合同金额统计信息
- `GET /api/v1/statistics/contracts/payment-collection` - 获取合同收款情况统计信息

## 开发指南

### 环境要求

- Node.js v16或更高版本
- MySQL v8.0或更高版本

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建`.env`文件并设置以下变量：

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=procontractledger
PORT=8080
JWT_SECRET=your_jwt_secret_key
```

### 初始化数据库

使用MySQL客户端执行以下SQL脚本：

1. `database/scripts/mysql_init.sql` - 创建数据库和表结构
2. `database/scripts/seed_data.sql` - 插入初始测试数据

### 启动服务器

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

服务器将在http://localhost:8080/api/v1运行


## API文档

本API服务完全实现了`backend_service/api_spec.yaml`中定义的OpenAPI规范。API设计遵循RESTful风格，提供了统一的请求和响应格式。

### 交互式API文档

服务启动后，可通过以下方式访问Swagger UI交互式API文档：

```
http://localhost:8080/api-docs
```

该文档基于`backend_service/api_spec.yaml`生成，提供了所有API端点的详细说明、请求参数和响应示例。您可以直接在Swagger UI界面中测试API调用（需要提供有效的JWT令牌）。

### 认证方式

除了登录接口外，所有API端点都需要通过JWT令牌进行认证。认证流程如下：

1. 调用`POST /api/v1/auth/login`获取访问令牌
2. 在后续请求的Header中添加`Authorization: Bearer <token>`

## 部署说明

1. 确保Node.js环境已安装
2. 设置生产环境变量
3. 安装PM2或类似工具进行进程管理：
   ```
   npm install -g pm2
   pm2 start server.js --name "contract-api"
   ```
