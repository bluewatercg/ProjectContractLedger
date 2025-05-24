/**
 * 付款相关路由
 */

const express = require('express');
const router = express.Router();
const { 
  getAllPayments, 
  getPaymentById, 
  createPayment, 
  updatePayment, 
  deletePayment
} = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authMiddleware');

// 应用认证中间件到所有路由
router.use(authenticateToken);

// 获取所有付款记录
router.get('/', getAllPayments);

// 获取单个付款记录
router.get('/:paymentId', getPaymentById);

// 创建付款记录
router.post('/', createPayment);

// 更新付款记录
router.put('/:paymentId', updatePayment);

// 删除付款记录
router.delete('/:paymentId', deletePayment);

module.exports = router;