/**
 * 用户控制器 - 处理用户相关的业务逻辑
 */

const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * 创建新用户
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function createUser(req, res) {
  try {
    const { username, email, password, is_active } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: '用户名、邮箱和密码为必填项' });
    }

    // 检查用户是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: '用户名或邮箱已存在' });
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10); // 10是盐度

    const [result] = await pool.execute(
      'INSERT INTO users (username, email, hashed_password, is_active) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, is_active !== undefined ? is_active : true]
    );

    res.status(201).json({ 
      message: '用户创建成功', 
      userId: result.insertId,
      username,
      email
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 获取所有用户
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getAllUsers(req, res) {
  try {
    const [users] = await pool.execute('SELECT id, username, email, is_active, created_at FROM users');
    res.json(users);
  } catch (error) {
    console.error('获取所有用户错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 根据ID获取用户
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const [users] = await pool.execute('SELECT id, username, email, is_active, created_at FROM users WHERE id = ?', [id]);

    if (users.length === 0) {
      return res.status(404).json({ message: '用户未找到' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('获取用户错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 更新用户信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, email, password, is_active } = req.body;
    let updateFields = [];
    let updateValues = [];

    if (username) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('hashed_password = ?');
      updateValues.push(hashedPassword);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: '没有提供要更新的字段' });
    }

    updateValues.push(id); // Add ID for WHERE clause

    const [result] = await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '用户未找到或没有更改' });
    }

    res.json({ message: '用户更新成功' });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 删除用户
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '用户未找到' });
    }

    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
