/**
 * 客户相关路由
 */

const express = require('express');
const router = express.Router();
const { 
  getAllCustomers, 
  getCustomerById, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  getCustomerInvoiceInfos,
  createCustomerInvoiceInfo,
  updateCustomerInvoiceInfo,
  deleteCustomerInvoiceInfo
} = require('../controllers/customerController');
const { authenticateToken } = require('../middleware/authMiddleware');

// 应用认证中间件到所有路由
router.use(authenticateToken);

// 获取所有客户
router.get('/', getAllCustomers);

// 获取单个客户
router.get('/:customerId', getCustomerById);

// 创建客户
router.post('/', createCustomer);

// 更新客户
router.put('/:customerId', updateCustomer);

// 删除客户
router.delete('/:customerId', deleteCustomer);

// 获取客户的开票信息列表
router.get('/:customerId/invoice-infos', getCustomerInvoiceInfos);

// 创建客户开票信息
router.post('/:customerId/invoice-infos', createCustomerInvoiceInfo);

// 更新客户开票信息
router.put('/:customerId/invoice-infos/:infoId', updateCustomerInvoiceInfo);

// 删除客户开票信息
router.delete('/:customerId/invoice-infos/:infoId', deleteCustomerInvoiceInfo);

module.exports = router;