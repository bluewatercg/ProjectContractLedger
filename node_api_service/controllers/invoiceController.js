/**
 * 发票控制器
 */

const { pool } = require('../config/database');

/**
 * 获取所有发票
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getAllInvoices(req, res) {
  try {
    // 获取查询参数
    const { 
      contract_id, 
      invoice_number, 
      status, 
      issue_date, 
      due_date
    } = req.query;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    // 构建基础查询
    let query = `
      SELECT i.invoice_id, i.invoice_number, i.amount, i.issue_date, i.due_date, i.status, i.notes, i.created_at,
             c.contract_id, c.contract_number, c.name as contract_name,
             cust.customer_id, cust.name as customer_name,
             ii.id as invoice_info_id, ii.company_name
      FROM invoices i
      JOIN contracts c ON i.contract_id = c.contract_id
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN invoice_infos ii ON i.invoice_info_id = ii.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM invoices i WHERE 1=1';
    let params = [];
    let countParams = [];
    
    // 添加筛选条件
    if (contract_id) {
      query += ' AND i.contract_id = ?';
      countQuery += ' AND i.contract_id = ?';
      params.push(contract_id);
      countParams.push(contract_id);
    }
    
    if (invoice_number) {
      query += ' AND i.invoice_number LIKE ?';
      countQuery += ' AND i.invoice_number LIKE ?';
      params.push(`%${invoice_number}%`);
      countParams.push(`%${invoice_number}%`);
    }
    
    if (status) {
      query += ' AND i.status = ?';
      countQuery += ' AND i.status = ?';
      params.push(status);
      countParams.push(status);
    }
    
    if (issue_date) {
      query += ' AND i.issue_date >= ?';
      countQuery += ' AND i.issue_date >= ?';
      params.push(issue_date);
      countParams.push(issue_date);
    }
    
    if (due_date) {
      query += ' AND i.due_date <= ?';
      countQuery += ' AND i.due_date <= ?';
      params.push(due_date);
      countParams.push(due_date);
    }
    
    // 添加排序和分页
    query += ` ORDER BY i.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`;
    
    // 执行查询
    const [invoices] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    
    // 格式化日期
    invoices.forEach(invoice => {
      if (invoice.issue_date) {
        invoice.issue_date = invoice.issue_date.toISOString().split('T')[0];
      }
      if (invoice.due_date) {
        invoice.due_date = invoice.due_date.toISOString().split('T')[0];
      }
    });
    
    // 返回结果
    res.json({
      data: invoices,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取发票列表失败:', error);
    res.status(500).json({ message: '获取发票列表失败', error: error.message });
  }
}

/**
 * 获取单个发票
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getInvoiceById(req, res) {
  try {
    const { invoiceId } = req.params;
    
    // 查询发票信息
    const query = `
      SELECT i.invoice_id, i.invoice_number, i.amount, i.issue_date, i.due_date, i.status, i.notes, i.created_at,
             c.contract_id, c.contract_number, c.name as contract_name,
             cust.customer_id, cust.name as customer_name,
             ii.id as invoice_info_id, ii.company_name, ii.tax_number, ii.bank_name, ii.bank_account, ii.address, ii.phone
      FROM invoices i
      JOIN contracts c ON i.contract_id = c.contract_id
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN invoice_infos ii ON i.invoice_info_id = ii.id
      WHERE i.invoice_id = ?
    `;
    
    const [invoices] = await pool.execute(query, [invoiceId]);
    
    if (invoices.length === 0) {
      return res.status(404).json({ message: '发票不存在' });
    }
    
    const invoice = invoices[0];
    
    // 格式化日期
    if (invoice.issue_date) {
      invoice.issue_date = invoice.issue_date.toISOString().split('T')[0];
    }
    if (invoice.due_date) {
      invoice.due_date = invoice.due_date.toISOString().split('T')[0];
    }
    
    // 查询相关付款记录
    const paymentsQuery = `
      SELECT payment_id, amount, payment_date, payment_method, reference_number, notes, created_at
      FROM payments
      WHERE invoice_id = ?
      ORDER BY payment_date DESC
    `;
    
    const [payments] = await pool.execute(paymentsQuery, [invoiceId]);
    
    // 格式化付款日期
    payments.forEach(payment => {
      if (payment.payment_date) {
        payment.payment_date = payment.payment_date.toISOString().split('T')[0];
      }
    });
    
    // 返回结果，包含发票信息和相关付款记录
    res.json({
      ...invoice,
      payments
    });
  } catch (error) {
    console.error('获取发票详情失败:', error);
    res.status(500).json({ message: '获取发票详情失败', error: error.message });
  }
}

/**
 * 创建发票
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function createInvoice(req, res) {
  try {
    const { 
      contract_id, 
      invoice_info_id, 
      invoice_number, 
      amount, 
      issue_date, 
      due_date, 
      status, 
      notes 
    } = req.body;
    
    // 验证必填字段
    if (!contract_id || !invoice_info_id || !invoice_number || !amount || !issue_date || !due_date || !status) {
      return res.status(400).json({ message: '缺少必要的发票信息' });
    }
    
    // 检查合同是否存在
    const [contracts] = await pool.execute('SELECT contract_id FROM contracts WHERE contract_id = ?', [contract_id]);
    if (contracts.length === 0) {
      return res.status(404).json({ message: '关联的合同不存在' });
    }
    
    // 检查发票信息是否存在
    const [invoiceInfos] = await pool.execute('SELECT id FROM invoice_infos WHERE id = ?', [invoice_info_id]);
    if (invoiceInfos.length === 0) {
      return res.status(404).json({ message: '关联的发票信息不存在' });
    }
    
    // 检查发票号码是否已存在
    const [existingInvoices] = await pool.execute('SELECT invoice_id FROM invoices WHERE invoice_number = ?', [invoice_number]);
    if (existingInvoices.length > 0) {
      return res.status(409).json({ message: '发票号码已存在' });
    }
    
    // 插入发票记录
    const insertQuery = `
      INSERT INTO invoices (contract_id, invoice_info_id, invoice_number, amount, issue_date, due_date, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(insertQuery, [
      contract_id,
      invoice_info_id,
      invoice_number,
      amount,
      issue_date,
      due_date,
      status,
      notes || null
    ]);
    
    // 返回创建的发票ID
    res.status(201).json({
      message: '发票创建成功',
      invoice_id: result.insertId
    });
  } catch (error) {
    console.error('创建发票失败:', error);
    res.status(500).json({ message: '创建发票失败', error: error.message });
  }
}

/**
 * 更新发票
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function updateInvoice(req, res) {
  try {
    const { invoiceId } = req.params;
    const { 
      invoice_info_id, 
      invoice_number, 
      amount, 
      issue_date, 
      due_date, 
      status, 
      notes 
    } = req.body;
    
    // 检查发票是否存在
    const [invoices] = await pool.execute('SELECT invoice_id FROM invoices WHERE invoice_id = ?', [invoiceId]);
    if (invoices.length === 0) {
      return res.status(404).json({ message: '发票不存在' });
    }
    
    // 如果更新发票号码，检查是否与其他发票冲突
    if (invoice_number) {
      const [existingInvoices] = await pool.execute(
        'SELECT invoice_id FROM invoices WHERE invoice_number = ? AND invoice_id != ?', 
        [invoice_number, invoiceId]
      );
      if (existingInvoices.length > 0) {
        return res.status(409).json({ message: '发票号码已被其他发票使用' });
      }
    }
    
    // 构建更新查询
    let updateQuery = 'UPDATE invoices SET ';
    const updateParams = [];
    const updateFields = [];
    
    if (invoice_info_id) {
      updateFields.push('invoice_info_id = ?');
      updateParams.push(invoice_info_id);
    }
    
    if (invoice_number) {
      updateFields.push('invoice_number = ?');
      updateParams.push(invoice_number);
    }
    
    if (amount) {
      updateFields.push('amount = ?');
      updateParams.push(amount);
    }
    
    if (issue_date) {
      updateFields.push('issue_date = ?');
      updateParams.push(issue_date);
    }
    
    if (due_date) {
      updateFields.push('due_date = ?');
      updateParams.push(due_date);
    }
    
    if (status) {
      updateFields.push('status = ?');
      updateParams.push(status);
    }
    
    // notes可以为null
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateParams.push(notes);
    }
    
    // 如果没有要更新的字段，返回成功
    if (updateFields.length === 0) {
      return res.json({ message: '发票未做任何更改' });
    }
    
    // 完成更新查询
    updateQuery += updateFields.join(', ') + ' WHERE invoice_id = ?';
    updateParams.push(invoiceId);
    
    // 执行更新
    await pool.execute(updateQuery, updateParams);
    
    // 返回成功消息
    res.json({ message: '发票更新成功' });
  } catch (error) {
    console.error('更新发票失败:', error);
    res.status(500).json({ message: '更新发票失败', error: error.message });
  }
}

/**
 * 删除发票
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function deleteInvoice(req, res) {
  try {
    const { invoiceId } = req.params;
    
    // 检查发票是否存在
    const [invoices] = await pool.execute('SELECT invoice_id FROM invoices WHERE invoice_id = ?', [invoiceId]);
    if (invoices.length === 0) {
      return res.status(404).json({ message: '发票不存在' });
    }
    
    // 检查是否有关联的付款记录
    const [payments] = await pool.execute('SELECT payment_id FROM payments WHERE invoice_id = ?', [invoiceId]);
    if (payments.length > 0) {
      return res.status(409).json({ 
        message: '无法删除发票，存在关联的付款记录',
        payments_count: payments.length
      });
    }
    
    // 删除发票
    await pool.execute('DELETE FROM invoices WHERE invoice_id = ?', [invoiceId]);
    
    // 返回成功消息
    res.json({ message: '发票删除成功' });
  } catch (error) {
    console.error('删除发票失败:', error);
    res.status(500).json({ message: '删除发票失败', error: error.message });
  }
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
};
