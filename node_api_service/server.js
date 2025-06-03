/**
 * 客户合同管理系统 - 服务器启动文件
 */

require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');

// 获取端口配置，默认为8080
const PORT = process.env.PORT || 8080;

// 启动服务器前测试数据库连接
async function startServer() {
  try {
    console.log('正在测试数据库连接...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('数据库连接失败，服务器启动中止');
      process.exit(1);
    }

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器已启动，运行在 http://127.0.0.1:${PORT}/api/v1`);
      console.log(`API文档地址: http://127.0.0.1:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();