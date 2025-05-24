/**
 * 统计控制器 - 处理与数据统计相关的请求
 */

const { pool } = require('../config/database');

/**
 * 获取合同金额统计信息
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getContractAmountStatistics(req, res) {
  try {
    // 获取查询参数
    const { status = 'active' } = req.query;
    
    // 构建查询语句
    const query = `
      SELECT 
        COUNT(*) as contract_count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM contracts
      WHERE status = ?
    `;
    
    // 执行查询
    const [results] = await pool.execute(query, [status]);
    console.log('Query Results:', results); // 打印查询结果
    
    if (results.length === 0 || !results[0].contract_count) { // 增加对 contract_count 的检查
      return res.status(200).json({
        contract_count: 0,
        total_amount: "0.00",
        avg_amount: "0.00"
      });
    }
    
    // 格式化结果
    const statistics = {
      contract_count: results[0].contract_count,
      total_amount: results[0].total_amount ? parseFloat(results[0].total_amount).toFixed(2) : "0.00",
      avg_amount: results[0].avg_amount ? parseFloat(results[0].avg_amount).toFixed(2) : "0.00"
    };
    
    res.status(200).json(statistics);
  } catch (error) {
    console.error('获取合同金额统计信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取合同金额统计信息失败',
      details: error.message
    });
  }
}

/**
 * 获取合同收款情况统计信息
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getContractPaymentCollectionStatistics(req, res) {
  try {
    // 构建查询语句
    const query = `
      SELECT 
        ct.contract_id,
        ct.name as contract_name,
        ct.amount as contract_amount,
        COALESCE(SUM(p.amount), 0) as paid_amount,
        (ct.amount - COALESCE(SUM(p.amount), 0)) as remaining_amount
      FROM contracts ct
      LEFT JOIN invoices i ON ct.contract_id = i.contract_id
      LEFT JOIN payments p ON i.invoice_id = p.invoice_id
      GROUP BY ct.contract_id, ct.name, ct.amount
    `;
    
    // 执行查询
    const [results] = await pool.execute(query);
    
    // 格式化结果
    const statistics = results.map(item => ({
      contract_id: item.contract_id,
      contract_name: item.contract_name,
      contract_amount: parseFloat(item.contract_amount).toFixed(2),
      paid_amount: parseFloat(item.paid_amount).toFixed(2),
      remaining_amount: parseFloat(item.remaining_amount).toFixed(2)
    }));
    
    res.status(200).json(statistics);
  } catch (error) {
    console.error('获取合同收款情况统计信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取合同收款情况统计信息失败',
      details: error.message
    });
  }
}

module.exports = {
  getContractAmountStatistics,
  getContractPaymentCollectionStatistics
};
