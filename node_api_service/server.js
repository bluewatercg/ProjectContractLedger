/**
 * 客户合同管理系统 - 服务器启动文件
 */

require('dotenv').config();
const app = require('./app');

// 获取端口配置，默认为3000
const PORT = process.env.PORT || 3000;

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已启动，运行在 http://127.0.0.1:${PORT}/api/v1`);
  console.log(`API文档地址: http://127.0.0.1:${PORT}/api-docs`);
});