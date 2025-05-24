/**
 * 认证相关路由
 */

const express = require('express');
const router = express.Router();
const { login, validateToken } = require('../controllers/authController');

// 用户登录
router.post('/login', login);

// 验证令牌
router.get('/validate', validateToken);

module.exports = router;