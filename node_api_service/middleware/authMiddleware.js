/**
 * 认证中间件
 */

const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

/**
 * 验证JWT令牌中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
async function authenticateToken(req, res, next) {
  try {
    // 从请求头获取令牌
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    
    // 查询用户是否存在且激活
    const [users] = await pool.execute(
      'SELECT id, username, email, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({ message: '无效的用户或账户已禁用' });
    }
    
    // 将用户信息添加到请求对象
    req.user = {
      id: users[0].id,
      username: users[0].username,
      email: users[0].email
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '无效的令牌或令牌已过期' });
    }
    
    console.error('认证中间件错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

module.exports = {
  authenticateToken
};