/**
 * 合同控制器
 */

const { pool } = require('../config/database');

/**
 * 获取所有合同
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getAllContracts(req, res) {
  try {
    // 获取查询参数
    const { 
      customer_id, 
      contract_number, 
      name, 
      status, 
      start_date, 
      end_date
    } = req.query;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    // 构建基础查询
    let query = `
      SELECT c.contract_id, c.contract_number, c.name, c.amount, c.start_date, c.end_date, c.status, c.notes, c.created_at, c.updated_at,
             cust.customer_id, cust.name as customer_name
      FROM contracts c
      JOIN customers cust ON c.customer_id = cust.customer_id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM contracts c WHERE 1=1';
    let params = [];
    let countParams = [];
    
    // 添加筛选条件
    if (customer_id) {
      query += ' AND c.customer_id = ?';
      countQuery += ' AND c.customer_id = ?';
      params.push(customer_id);
      countParams.push(customer_id);
    }
    
    if (contract_number) {
      query += ' AND c.contract_number LIKE ?';
      countQuery += ' AND c.contract_number LIKE ?';
      params.push(`%${contract_number}%`);
      countParams.push(`%${contract_number}%`);
    }
    
    if (name) {
      query += ' AND c.name LIKE ?';
      countQuery += ' AND c.name LIKE ?';
      params.push(`%${name}%`);
      countParams.push(`%${name}%`);
    }
    
    if (status) {
      query += ' AND c.status = ?';
      countQuery += ' AND c.status = ?';
      params.push(status);
      countParams.push(status);
    }
    
    if (start_date) {
      query += ' AND c.start_date >= ?';
      countQuery += ' AND c.start_date >= ?';
      params.push(start_date);
      countParams.push(start_date);
    }
    
    if (end_date) {
      query += ' AND c.end_date <= ?';
      countQuery += ' AND c.end_date <= ?';
      params.push(end_date);
      countParams.push(end_date);
    }
    
    // 添加排序和分页
    query += ` ORDER BY c.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`;
    
    // 执行查询
    const [contracts] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    
    // 格式化日期
    contracts.forEach(contract => {
      if (contract.start_date) {
        contract.start_date = contract.start_date.toISOString().split('T')[0];
      }
      if (contract.end_date) {
        contract.end_date = contract.end_date.toISOString().split('T')[0];
      }
    });
    
    // 返回结果
    res.json({
      data: contracts,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取合同列表错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 获取单个合同
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getContractById(req, res) {
  try {
    const { contractId } = req.params;
    
    // 查询合同信息
    const [contracts] = await pool.execute(
      `SELECT c.contract_id, c.customer_id, c.contract_number, c.name, c.amount, c.start_date, c.end_date, c.status, c.notes, c.created_at, c.updated_at,
              cust.name as customer_name
       FROM contracts c
       JOIN customers cust ON c.customer_id = cust.customer_id
       WHERE c.contract_id = ?`,
      [contractId]
    );
    
    // 合同不存在
    if (contracts.length === 0) {
      return res.status(404).json({ message: '合同不存在' });
    }
    
    const contract = contracts[0];
    
    // 格式化日期
    if (contract.start_date) {
      contract.start_date = contract.start_date.toISOString().split('T')[0];
    }
    if (contract.end_date) {
      contract.end_date = contract.end_date.toISOString().split('T')[0];
    }
    
    // 查询关联的发票
    const [invoices] = await pool.execute(
      `SELECT i.invoice_id, i.invoice_number, i.amount, i.issue_date, i.due_date, i.status, i.notes, i.created_at
       FROM invoices i
       WHERE i.contract_id = ?
       ORDER BY i.issue_date DESC`,
      [contractId]
    );
    
    // 格式化发票日期
    invoices.forEach(invoice => {
      if (invoice.issue_date) {
        invoice.issue_date = invoice.issue_date.toISOString().split('T')[0];
      }
      if (invoice.due_date) {
        invoice.due_date = invoice.due_date.toISOString().split('T')[0];
      }
    });
    
    // 添加发票信息到合同对象
    contract.invoices = invoices;
    
    // 返回合同信息
    res.json(contract);
  } catch (error) {
    console.error('获取合同详情错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 创建合同
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function createContract(req, res) {
  try {
    const { customer_id, contract_number, name, amount, start_date, end_date, status, notes } = req.body;
    
    // 验证必填字段
    if (!customer_id || !contract_number || !name || !amount || !start_date || !end_date || !status) {
      return res.status(400).json({ message: '客户ID、合同编号、合同名称、金额、开始日期、结束日期和状态为必填项' });
    }
    
    // 检查客户是否存在
    const [customers] = await pool.execute(
      'SELECT customer_id FROM customers WHERE customer_id = ?',
      [customer_id]
    );
    
    if (customers.length === 0) {
      return res.status(404).json({ message: '客户不存在' });
    }
    
    // 检查合同编号是否已存在
    const [existingContracts] = await pool.execute(
      'SELECT contract_id FROM contracts WHERE contract_number = ?',
      [contract_number]
    );
    
    if (existingContracts.length > 0) {
      return res.status(400).json({ message: '合同编号已存在' });
    }
    
    // 插入合同记录
    const [result] = await pool.execute(
      'INSERT INTO contracts (customer_id, contract_number, name, amount, start_date, end_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [customer_id, contract_number, name, amount, start_date, end_date, status, notes || null]
    );
    
    // 获取新创建的合同信息
    const [contracts] = await pool.execute(
      `SELECT c.contract_id, c.customer_id, c.contract_number, c.name, c.amount, c.start_date, c.end_date, c.status, c.notes, c.created_at, c.updated_at,
              cust.name as customer_name
       FROM contracts c
       JOIN customers cust ON c.customer_id = cust.customer_id
       WHERE c.contract_id = ?`,
      [result.insertId]
    );
    
    const contract = contracts[0];
    
    // 格式化日期
    if (contract.start_date) {
      contract.start_date = contract.start_date.toISOString().split('T')[0];
    }
    if (contract.end_date) {
      contract.end_date = contract.end_date.toISOString().split('T')[0];
    }
    
    // 返回新合同信息
    res.status(201).json(contract);
  } catch (error) {
    console.error('创建合同错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 更新合同
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function updateContract(req, res) {
  try {
    const { contractId } = req.params;
    const { customer_id, contract_number, name, amount, start_date, end_date, status, notes } = req.body;
    
    // 验证必填字段
    if (!customer_id || !contract_number || !name || !amount || !start_date || !end_date || !status) {
      return res.status(400).json({ message: '客户ID、合同编号、合同名称、金额、开始日期、结束日期和状态为必填项' });
    }
    
    // 检查合同是否存在
    const [existingContracts] = await pool.execute(
      'SELECT contract_id, contract_number FROM contracts WHERE contract_id = ?',
      [contractId]
    );
    
    if (existingContracts.length === 0) {
      return res.status(404).json({ message: '合同不存在' });
    }
    
    // 检查客户是否存在
    const [customers] = await pool.execute(
      'SELECT customer_id FROM customers WHERE customer_id = ?',
      [customer_id]
    );
    
    if (customers.length === 0) {
      return res.status(404).json({ message: '客户不存在' });
    }
    
    // 如果合同编号已更改，检查新编号是否已存在
    if (contract_number !== existingContracts[0].contract_number) {
      const [duplicateContracts] = await pool.execute(
        'SELECT contract_id FROM contracts WHERE contract_number = ? AND contract_id != ?',
        [contract_number, contractId]
      );
      
      if (duplicateContracts.length > 0) {
        return res.status(400).json({ message: '合同编号已存在' });
      }
    }
    
    // 更新合同记录
    await pool.execute(
      'UPDATE contracts SET customer_id = ?, contract_number = ?, name = ?, amount = ?, start_date = ?, end_date = ?, status = ?, notes = ? WHERE contract_id = ?',
      [customer_id, contract_number, name, amount, start_date, end_date, status, notes || null, contractId]
    );
    
    // 获取更新后的合同信息
    const [contracts] = await pool.execute(
      `SELECT c.contract_id, c.customer_id, c.contract_number, c.name, c.amount, c.start_date, c.end_date, c.status, c.notes, c.created_at, c.updated_at,
              cust.name as customer_name
       FROM contracts c
       JOIN customers cust ON c.customer_id = cust.customer_id
       WHERE c.contract_id = ?`,
      [contractId]
    );
    
    const contract = contracts[0];
    
    // 格式化日期
    if (contract.start_date) {
      contract.start_date = contract.start_date.toISOString().split('T')[0];
    }
    if (contract.end_date) {
      contract.end_date = contract.end_date.toISOString().split('T')[0];
    }
    
    // 返回更新后的合同信息
    res.json(contract);
  } catch (error) {
    console.error('更新合同错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 删除合同
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function deleteContract(req, res) {
  try {
    const { contractId } = req.params;
    
    // 检查合同是否存在
    const [existingContracts] = await pool.execute(
      'SELECT contract_id FROM contracts WHERE contract_id = ?',
      [contractId]
    );
    
    if (existingContracts.length === 0) {
      return res.status(404).json({ message: '合同不存在' });
    }
    
    // 检查是否有关联的发票
    const [invoices] = await pool.execute(
      'SELECT invoice_id FROM invoices WHERE contract_id = ? LIMIT 1',
      [contractId]
    );
    
    if (invoices.length > 0) {
      return res.status(400).json({ message: '无法删除合同，存在关联的发票' });
    }
    
    // 删除合同记录
    await pool.execute(
      'DELETE FROM contracts WHERE contract_id = ?',
      [contractId]
    );
    
    // 返回成功消息
    res.json({ message: '合同删除成功' });
  } catch (error) {
    console.error('删除合同错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

module.exports = {
  getAllContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract
};
