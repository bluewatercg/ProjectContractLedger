/**
 * 认证控制器
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

/**
 * 用户登录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    // 验证请求体
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码为必填项' });
    }
    
    // 查询用户
    const [users] = await pool.execute(
      'SELECT id, username, email, hashed_password, is_active FROM users WHERE username = ? OR email = ?',
      [username, username]
    );
    
    // 用户不存在
    if (users.length === 0) {
      return res.status(401).json({ message: '用户名或密码不正确' });
    }
    
    const user = users[0];
    
    // 用户账户未激活
    if (!user.is_active) {
      return res.status(401).json({ message: '账户已被禁用，请联系管理员' });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名或密码不正确' });
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      // 添加日志，打印实际使用的JWT_SECRET
      console.log('JWT_SECRET used for signing:', process.env.JWT_SECRET || 'your_jwt_secret_key'),
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    // 返回令牌
    res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 验证令牌
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function validateToken(req, res) {
  try {
    // 从请求头获取令牌
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    const token = authHeader.split(' ')[1];

    // 验证令牌
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    console.log('JWT_SECRET used for verification:', jwtSecret); // 添加日志
    const decoded = jwt.verify(token, jwtSecret);

    // 查询用户是否存在且激活
    const [users] = await pool.execute(
      'SELECT id, username, email, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({ message: '无效的用户或账户已禁用' });
    }

    // 返回用户信息
    res.json({
      user: {
        id: users[0].id,
        username: users[0].username,
        email: users[0].email
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '无效的令牌或令牌已过期' });
    }

    console.error('验证令牌错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 刷新令牌
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function refreshToken(req, res) {
  try {
    // 从请求头获取令牌
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    const token = authHeader.split(' ')[1];

    // 验证令牌（即使过期也要能解析出用户信息）
    let decoded;
    try {
      const jwtSecretRefresh = process.env.JWT_SECRET || 'your_jwt_secret_key';
      console.log('JWT_SECRET used for refresh verification:', jwtSecretRefresh); // 添加日志
      decoded = jwt.verify(token, jwtSecretRefresh);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // 令牌过期，但仍可以解析用户信息
        decoded = jwt.decode(token);
      } else {
        return res.status(401).json({ message: '无效的令牌' });
      }
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: '无效的令牌格式' });
    }

    // 查询用户是否存在且激活
    const [users] = await pool.execute(
      'SELECT id, username, email, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({ message: '无效的用户或账户已禁用' });
    }

    const user = users[0];

    // 生成新的JWT令牌
    const newToken = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
      console.log('JWT_SECRET used for new token signing:', process.env.JWT_SECRET || 'your_jwt_secret_key') // 添加日志
    );

    // 返回新令牌
    res.json({
      access_token: newToken,
      token_type: 'bearer',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

module.exports = {
  login,
  validateToken,
  refreshToken
};