/**
 * 合同相关路由
 */

const express = require('express');
const router = express.Router();
const { 
  getAllContracts, 
  getContractById, 
  createContract, 
  updateContract, 
  deleteContract
} = require('../controllers/contractController');
const { authenticateToken } = require('../middleware/authMiddleware');

// 应用认证中间件到所有路由
router.use(authenticateToken);

// 获取所有合同
router.get('/', getAllContracts);

// 获取单个合同
router.get('/:contractId', getContractById);

// 创建合同
router.post('/', createContract);

// 更新合同
router.put('/:contractId', updateContract);

// 删除合同
router.delete('/:contractId', deleteContract);

module.exports = router;