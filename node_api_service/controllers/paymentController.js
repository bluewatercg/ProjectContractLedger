/**
 * 付款控制器
 */

const { pool } = require('../config/database');

/**
 * 获取所有付款记录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getAllPayments(req, res) {
  try {
    // 获取查询参数
    const { 
      invoice_id, 
      payment_method, 
      payment_date_from, 
      payment_date_to
    } = req.query;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    // 构建基础查询
    let query = `
      SELECT p.payment_id, p.amount, p.payment_date, p.payment_method, p.reference_number, p.notes, p.created_at,
             i.invoice_id, i.invoice_number,
             c.contract_id, c.contract_number, c.name as contract_name,
             cust.customer_id, cust.name as customer_name
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.invoice_id
      JOIN contracts c ON i.contract_id = c.contract_id
      JOIN customers cust ON c.customer_id = cust.customer_id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM payments p WHERE 1=1';
    let params = [];
    let countParams = [];
    
    // 添加筛选条件
    if (invoice_id) {
      query += ' AND p.invoice_id = ?';
      countQuery += ' AND p.invoice_id = ?';
      params.push(invoice_id);
      countParams.push(invoice_id);
    }
    
    if (payment_method) {
      query += ' AND p.payment_method LIKE ?';
      countQuery += ' AND p.payment_method LIKE ?';
      params.push(`%${payment_method}%`);
      countParams.push(`%${payment_method}%`);
    }
    
    if (payment_date_from) {
      query += ' AND p.payment_date >= ?';
      countQuery += ' AND p.payment_date >= ?';
      params.push(payment_date_from);
      countParams.push(payment_date_from);
    }
    
    if (payment_date_to) {
      query += ' AND p.payment_date <= ?';
      countQuery += ' AND p.payment_date <= ?';
      params.push(payment_date_to);
      countParams.push(payment_date_to);
    }
    
    // 添加排序和分页
    query += ` ORDER BY p.payment_date DESC LIMIT ${pageSize} OFFSET ${offset}`;
    
    console.log('getAllPayments - Query:', query);
    console.log('getAllPayments - Params:', params);
    console.log('getAllPayments - CountQuery:', countQuery);
    console.log('getAllPayments - CountParams:', countParams);

    // 执行查询
    const [payments] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    
    // 格式化日期
    payments.forEach(payment => {
      if (payment.payment_date) {
        payment.payment_date = payment.payment_date.toISOString().split('T')[0];
      }
    });
    
    // 返回结果
    res.json({
      data: payments,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取付款记录列表失败:', error);
    res.status(500).json({ message: '获取付款记录列表失败', error: error.message });
  }
}

/**
 * 获取单个付款记录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getPaymentById(req, res) {
  try {
    const { paymentId } = req.params;
    
    // 查询付款信息
    const query = `
      SELECT p.payment_id, p.amount, p.payment_date, p.payment_method, p.reference_number, p.notes, p.created_at,
             i.invoice_id, i.invoice_number, i.amount as invoice_amount, i.status as invoice_status,
             c.contract_id, c.contract_number, c.name as contract_name,
             cust.customer_id, cust.name as customer_name
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.invoice_id
      JOIN contracts c ON i.contract_id = c.contract_id
      JOIN customers cust ON c.customer_id = cust.customer_id
      WHERE p.payment_id = ?
    `;
    
    const [payments] = await pool.execute(query, [paymentId]);
    
    if (payments.length === 0) {
      return res.status(404).json({ message: '付款记录不存在' });
    }
    
    const payment = payments[0];
    
    // 格式化日期
    if (payment.payment_date) {
      payment.payment_date = payment.payment_date.toISOString().split('T')[0];
    }
    
    // 返回结果
    res.json(payment);
  } catch (error) {
    console.error('获取付款记录详情失败:', error);
    res.status(500).json({ message: '获取付款记录详情失败', error: error.message });
  }
}

/**
 * 创建付款记录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function createPayment(req, res) {
  try {
    const { 
      invoice_id, 
      amount, 
      payment_date, 
      payment_method, 
      reference_number, 
      notes 
    } = req.body;
    
    // 验证必填字段
    if (!invoice_id || !amount || !payment_date || !payment_method) {
      return res.status(400).json({ message: '缺少必要的付款信息' });
    }
    
    // 检查发票是否存在
    const [invoices] = await pool.execute('SELECT invoice_id, amount, status FROM invoices WHERE invoice_id = ?', [invoice_id]);
    if (invoices.length === 0) {
      return res.status(404).json({ message: '关联的发票不存在' });
    }
    
    // 插入付款记录
    const insertQuery = `
      INSERT INTO payments (invoice_id, amount, payment_date, payment_method, reference_number, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(insertQuery, [
      invoice_id,
      amount,
      payment_date,
      payment_method,
      reference_number || null,
      notes || null
    ]);
    
    // 检查是否需要更新发票状态
    const invoice = invoices[0];
    if (invoice.status !== '已收款') {
      // 获取该发票的所有付款总额
      const [paymentSums] = await pool.execute(
        'SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?', 
        [invoice_id]
      );
      
      const totalPaid = parseFloat(paymentSums[0].total_paid || 0);
      const invoiceAmount = parseFloat(invoice.amount);
      
      // 如果付款总额大于等于发票金额，更新发票状态为已收款
      if (totalPaid >= invoiceAmount) {
        await pool.execute(
          'UPDATE invoices SET status = ? WHERE invoice_id = ?',
          ['已收款', invoice_id]
        );
      }
    }
    
    // 返回创建的付款ID
    res.status(201).json({
      message: '付款记录创建成功',
      payment_id: result.insertId
    });
  } catch (error) {
    console.error('创建付款记录失败:', error);
    res.status(500).json({ message: '创建付款记录失败', error: error.message });
  }
}

/**
 * 更新付款记录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function updatePayment(req, res) {
  try {
    const { paymentId } = req.params;
    const { 
      amount, 
      payment_date, 
      payment_method, 
      reference_number, 
      notes 
    } = req.body;
    
    // 检查付款记录是否存在
    const [payments] = await pool.execute('SELECT payment_id, invoice_id FROM payments WHERE payment_id = ?', [paymentId]);
    if (payments.length === 0) {
      return res.status(404).json({ message: '付款记录不存在' });
    }
    
    // 构建更新查询
    let updateQuery = 'UPDATE payments SET ';
    const updateParams = [];
    const updateFields = [];
    
    if (amount) {
      updateFields.push('amount = ?');
      updateParams.push(amount);
    }
    
    if (payment_date) {
      updateFields.push('payment_date = ?');
      updateParams.push(payment_date);
    }
    
    if (payment_method) {
      updateFields.push('payment_method = ?');
      updateParams.push(payment_method);
    }
    
    if (reference_number !== undefined) {
      updateFields.push('reference_number = ?');
      updateParams.push(reference_number);
    }
    
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateParams.push(notes);
    }
    
    // 如果没有要更新的字段，返回成功
    if (updateFields.length === 0) {
      return res.json({ message: '付款记录未做任何更改' });
    }
    
    // 完成更新查询
    updateQuery += updateFields.join(', ') + ' WHERE payment_id = ?';
    updateParams.push(paymentId);
    
    // 执行更新
    await pool.execute(updateQuery, updateParams);
    
    // 如果更新了金额，检查是否需要更新发票状态
    if (amount) {
      const invoice_id = payments[0].invoice_id;
      
      // 获取发票信息
      const [invoices] = await pool.execute('SELECT amount FROM invoices WHERE invoice_id = ?', [invoice_id]);
      if (invoices.length > 0) {
        const invoiceAmount = parseFloat(invoices[0].amount);
        
        // 获取该发票的所有付款总额
        const [paymentSums] = await pool.execute(
          'SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?', 
          [invoice_id]
        );
        
        const totalPaid = parseFloat(paymentSums[0].total_paid || 0);
        
        // 根据付款总额更新发票状态
        let newStatus;
        if (totalPaid >= invoiceAmount) {
          newStatus = '已收款';
        } else {
          newStatus = '已开票'; // 假设默认状态为已开票
        }
        
        await pool.execute(
          'UPDATE invoices SET status = ? WHERE invoice_id = ?',
          [newStatus, invoice_id]
        );
      }
    }
    
    // 返回成功消息
    res.json({ message: '付款记录更新成功' });
  } catch (error) {
    console.error('更新付款记录失败:', error);
    res.status(500).json({ message: '更新付款记录失败', error: error.message });
  }
}

/**
 * 删除付款记录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function deletePayment(req, res) {
  try {
    const { paymentId } = req.params;
    
    // 检查付款记录是否存在
    const [payments] = await pool.execute('SELECT payment_id, invoice_id, amount FROM payments WHERE payment_id = ?', [paymentId]);
    if (payments.length === 0) {
      return res.status(404).json({ message: '付款记录不存在' });
    }
    
    const payment = payments[0];
    const invoice_id = payment.invoice_id;
    
    // 删除付款记录
    await pool.execute('DELETE FROM payments WHERE payment_id = ?', [paymentId]);
    
    // 更新发票状态
    // 获取发票信息
    const [invoices] = await pool.execute('SELECT amount, status FROM invoices WHERE invoice_id = ?', [invoice_id]);
    if (invoices.length > 0) {
      const invoice = invoices[0];
      
      // 如果发票状态为已收款，检查剩余付款总额
      if (invoice.status === '已收款') {
        // 获取该发票的剩余付款总额
        const [paymentSums] = await pool.execute(
          'SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?', 
          [invoice_id]
        );
        
        const totalPaid = parseFloat(paymentSums[0].total_paid || 0);
        const invoiceAmount = parseFloat(invoice.amount);
        
        // 如果剩余付款总额小于发票金额，更新发票状态为已开票
        if (totalPaid < invoiceAmount) {
          await pool.execute(
            'UPDATE invoices SET status = ? WHERE invoice_id = ?',
            ['已开票', invoice_id]
          );
        }
      }
    }
    
    // 返回成功消息
    res.json({ message: '付款记录删除成功' });
  } catch (error) {
    console.error('删除付款记录失败:', error);
    res.status(500).json({ message: '删除付款记录失败', error: error.message });
  }
}

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment
};
