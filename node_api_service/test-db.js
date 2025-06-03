/**
 * 数据库连接测试脚本
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'procontractledger',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('数据库配置:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  password: dbConfig.password ? '***' : '(empty)'
});

async function testConnection() {
  try {
    console.log('正在连接数据库...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功!');
    
    // 测试查询
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('测试查询结果:', rows);
    
    await connection.end();
    console.log('连接已关闭');
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    console.error('错误详情:', error);
  }
}

testConnection();
