/**
 * 客户合同管理系统 - 应用入口文件
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// 创建Express应用
const app = express();

// 加载API规范文件
const apiSpec = YAML.load(path.join(__dirname, '../backend_service/api_spec.yaml'));

// 中间件配置
app.use(cors()); // 启用CORS
app.use(morgan('dev')); // 日志记录
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体

// API文档路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiSpec));

// API基础路径
const apiBasePath = '/api/v1';

// 路由配置
app.use(`${apiBasePath}/auth`, require('./routes/authRoutes'));
app.use(`${apiBasePath}/customers`, require('./routes/customerRoutes'));
app.use(`${apiBasePath}/contracts`, require('./routes/contractRoutes'));
app.use(`${apiBasePath}/invoices`, require('./routes/invoiceRoutes'));
app.use(`${apiBasePath}/payments`, require('./routes/paymentRoutes'));
app.use(`${apiBasePath}/statistics`, require('./routes/statisticsRoutes'));
app.use(`${apiBasePath}/users`, require('./routes/userRoutes'));

// 根路径响应
app.get('/', (req, res) => {
  res.json({
    message: '客户合同管理系统API服务',
    documentation: '/api-docs',
    version: '1.0.0'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ message: '请求的资源不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

module.exports = app;
