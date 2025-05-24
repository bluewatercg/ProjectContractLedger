/**
 * 发票相关路由
 */

const express = require('express');
const router = express.Router();
const { 
  getAllInvoices, 
  getInvoiceById, 
  createInvoice, 
  updateInvoice, 
  deleteInvoice
} = require('../controllers/invoiceController');
const { authenticateToken } = require('../middleware/authMiddleware');

// 应用认证中间件到所有路由
router.use(authenticateToken);

// 获取所有发票
router.get('/', getAllInvoices);

// 获取单个发票
router.get('/:invoiceId', getInvoiceById);

// 创建发票
router.post('/', createInvoice);

// 更新发票
router.put('/:invoiceId', updateInvoice);

// 删除发票
router.delete('/:invoiceId', deleteInvoice);

module.exports = router;