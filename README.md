# 客户合同管理系统

## 项目概述

这是一个用于管理客户、合同、发票和付款的全栈应用系统。系统允许用户创建和管理客户信息、合同、发票记录和付款记录，并提供数据统计和提醒功能。

## 技术栈

### 前端
- HTML5, CSS3, JavaScript (ES6+)
- 使用原生JavaScript实现动态交互
- 使用Tailwind CSS进行样式设计
- Font Awesome图标库

### 后端
- Node.js v16+
- Express.js v4.18+
- MySQL v8.0+
- 使用mysql2库进行数据库连接

## 项目结构

```
├── node_api_service/     # 后端API服务
│   ├── config/           # 配置文件
│   ├── controllers/      # 控制器
│   ├── models/           # 数据模型
│   ├── routes/           # 路由定义
│   ├── utils/            # 工具函数
│   ├── app.js            # 应用入口
│   ├── package.json      # 依赖配置
│   └── README.md         # 后端说明文档
│
├── database/             # 数据库相关文件
│   ├── scripts/          # SQL脚本
│   └── diagrams/         # 数据库图表
│
├── design/               # 设计文件
│   ├── prototypes/       # HTML原型
│   ├── specs/            # 设计规范
│   └── Flowchart.md      # 流程图
│
└── docs/                 # 项目文档
```

## 开发环境设置

### 后端开发环境

1. 进入后端目录：
   ```
   cd node_api_service
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 配置环境变量：
   创建`.env`文件并设置以下变量：
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=procontractledger
   PORT=8080
   ```

4. 初始化数据库：
   使用MySQL客户端执行`database/scripts/mysql_init.sql`和`database/scripts/seed_data.sql`脚本。

5. 启动服务器：
   ```
   npm start
   ```

6. API服务将在http://localhost:8080/api/v1运行

### 前端开发环境

1. 进入前端目录：
   ```
   cd frontend
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 启动前端服务：
   ```
   npm start
   ```

4. 前端服务将在http://localhost:8000运行

## 部署说明

### 前端部署

前端为静态文件，可部署到任何Web服务器或CDN。

### 后端部署

1. 确保Node.js环境已安装
2. 设置生产环境变量
3. 安装PM2或类似工具进行进程管理：
   ```
   npm install -g pm2
   pm2 start app.js --name "contract-api"
   ```

## 许可证

[MIT](LICENSE)