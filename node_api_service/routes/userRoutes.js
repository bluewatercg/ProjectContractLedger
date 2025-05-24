/**
 * 用户路由 - 处理与用户管理相关的路由
 */

const express = require('express');
const router = express.Router();
const { 
  createUser, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

// 应用认证中间件到所有用户管理路由
router.use(authenticateToken);

// 创建新用户 (通常只有管理员可以创建)
router.post('/', createUser);

// 获取所有用户
router.get('/', getAllUsers);

// 根据ID获取用户
router.get('/:id', getUserById);

// 更新用户信息
router.put('/:id', updateUser);

// 删除用户
router.delete('/:id', deleteUser);

module.exports = router;
