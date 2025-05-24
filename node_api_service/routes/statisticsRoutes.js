/**
 * 统计路由 - 处理与数据统计相关的路由
 */

const express = require('express');
const router = express.Router();
const { 
  getContractAmountStatistics,
  getContractPaymentCollectionStatistics 
} = require('../controllers/statisticsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// 应用认证中间件到所有路由
router.use(authenticateToken);

// 获取合同金额统计信息
router.get('/contracts/amount', getContractAmountStatistics);

// 获取合同收款情况统计信息
router.get('/contracts/payment-collection', getContractPaymentCollectionStatistics);

module.exports = router;
