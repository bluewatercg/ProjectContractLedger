/**
 * 客户控制器
 */

const { pool } = require('../config/database');

/**
 * 获取所有客户
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
// 辅助函数：将查询中的占位符替换为参数值
function formatSQL(query, params) {
  let formatted = query;
  let paramIndex = 0;

  // 替换所有的 ? 占位符
  formatted = formatted.replace(/\?/g, () => {
    if (paramIndex >= params.length) return '?'; // 防止参数不足
    const param = params[paramIndex++];
    // 如果参数是字符串，添加单引号；如果是数字，直接返回
    return typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param;
  });

  return formatted;
}

async function getAllCustomers(req, res) {
  try {
    console.log('Raw req.query:', req.query);
    const { name } = req.query;
    let page = parseInt(req.query.page);
    let pageSize = parseInt(req.query.pageSize);

    page = isNaN(page) || page < 1 ? 1 : page;
    pageSize = isNaN(pageSize) || pageSize < 1 ? 10 : pageSize;
    const offset = (page - 1) * pageSize;

    if (isNaN(offset) || offset < 0) {
      console.error('Invalid offset:', offset, 'from page:', page, 'pageSize:', pageSize);
      return res.status(400).json({ message: 'Invalid offset' });
    }

    console.log('Parsed page:', page, 'pageSize:', pageSize, 'offset:', offset);

    let query = 'SELECT customer_id, name, contact_person, phone, email, address, created_at, updated_at FROM customers';
    let countQuery = 'SELECT COUNT(*) as total FROM customers';
    let queryParams = [];
    let countParams = [];

    if (name) {
      query += ' WHERE name LIKE ?';
      countQuery += ' WHERE name LIKE ?';
      queryParams.push(`%${name}%`);
      countParams.push(`%${name}%`);
    }

    // Hardcode LIMIT and OFFSET for debugging
    query += ` ORDER BY name ASC LIMIT ${pageSize} OFFSET ${offset}`;

    console.log('Query Params:', queryParams);
    console.log('Count Params:', countParams);
    console.log('Main Query:', formatSQL(query, queryParams));
    console.log('Count Query:', formatSQL(countQuery, countParams));

    const [customers] = await pool.execute(query, queryParams);
    const [countResult] = await pool.execute(countQuery, countParams);

    res.json({
      data: customers,
      pagination: {
        total: countResult[0].total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error('获取客户列表错误:', error);
    console.error('Query Params at Error:', queryParams);
    console.error('Main Query at Error:', formatSQL(query, queryParams));
    res.status(500).json({ message: '服务器内部错误' });
  }
}


/**
 * 获取单个客户
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getCustomerById(req, res) {
  try {
    const { customerId } = req.params;
    
    // 查询客户信息
    const [customers] = await pool.execute(
      'SELECT customer_id, name, contact_person, phone, email, address, notes, created_at, updated_at FROM customers WHERE customer_id = ?',
      [customerId]
    );
    
    // 客户不存在
    if (customers.length === 0) {
      return res.status(404).json({ message: '客户不存在' });
    }
    
    // 返回客户信息
    res.json(customers[0]);
  } catch (error) {
    console.error('获取客户详情错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 创建客户
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function createCustomer(req, res) {
  try {
    const { name, contact_person, phone, email, address, notes } = req.body;
    
    // 验证必填字段
    if (!name) {
      return res.status(400).json({ message: '客户名称为必填项' });
    }
    
    // 插入客户记录
    const [result] = await pool.execute(
      'INSERT INTO customers (name, contact_person, phone, email, address, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [name, contact_person || null, phone || null, email || null, address || null, notes || null]
    );
    
    // 获取新创建的客户信息
    const [customers] = await pool.execute(
      'SELECT customer_id, name, contact_person, phone, email, address, notes, created_at, updated_at FROM customers WHERE customer_id = ?',
      [result.insertId]
    );
    
    // 返回新客户信息
    res.status(201).json(customers[0]);
  } catch (error) {
    console.error('创建客户错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 更新客户
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function updateCustomer(req, res) {
  try {
    const { customerId } = req.params;
    const { name, contact_person, phone, email, address, notes } = req.body;
    
    // 验证必填字段
    if (!name) {
      return res.status(400).json({ message: '客户名称为必填项' });
    }
    
    // 检查客户是否存在
    const [existingCustomers] = await pool.execute(
      'SELECT customer_id FROM customers WHERE customer_id = ?',
      [customerId]
    );
    
    if (existingCustomers.length === 0) {
      return res.status(404).json({ message: '客户不存在' });
    }
    
    // 更新客户记录
    await pool.execute(
      'UPDATE customers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, notes = ? WHERE customer_id = ?',
      [name, contact_person || null, phone || null, email || null, address || null, notes || null, customerId]
    );
    
    // 获取更新后的客户信息
    const [customers] = await pool.execute(
      'SELECT customer_id, name, contact_person, phone, email, address, notes, created_at, updated_at FROM customers WHERE customer_id = ?',
      [customerId]
    );
    
    // 返回更新后的客户信息
    res.json(customers[0]);
  } catch (error) {
    console.error('更新客户错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 删除客户
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function deleteCustomer(req, res) {
  try {
    const { customerId } = req.params;
    
    // 检查客户是否存在
    const [existingCustomers] = await pool.execute(
      'SELECT customer_id FROM customers WHERE customer_id = ?',
      [customerId]
    );
    
    if (existingCustomers.length === 0) {
      return res.status(404).json({ message: '客户不存在' });
    }
    
    // 检查是否有关联的合同
    const [contracts] = await pool.execute(
      'SELECT contract_id FROM contracts WHERE customer_id = ? LIMIT 1',
      [customerId]
    );
    
    if (contracts.length > 0) {
      return res.status(400).json({ message: '无法删除客户，存在关联的合同' });
    }
    
    // 删除客户的开票信息
    await pool.execute(
      'DELETE FROM invoice_infos WHERE customer_id = ?',
      [customerId]
    );
    
    // 删除客户记录
    await pool.execute(
      'DELETE FROM customers WHERE customer_id = ?',
      [customerId]
    );
    
    // 返回成功消息
    res.json({ message: '客户删除成功' });
  } catch (error) {
    console.error('删除客户错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 获取客户的开票信息列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getCustomerInvoiceInfos(req, res) {
  try {
    const { customerId } = req.params;
    
    // 检查客户是否存在
    const [existingCustomers] = await pool.execute(
      'SELECT customer_id FROM customers WHERE customer_id = ?',
      [customerId]
    );
    
    if (existingCustomers.length === 0) {
      return res.status(404).json({ message: '客户不存在' });
    }
    
    // 查询客户的开票信息
    const [invoiceInfos] = await pool.execute(
      'SELECT id, customer_id, company_name, tax_number, bank_name, bank_account, address, phone, is_default, created_at FROM invoice_infos WHERE customer_id = ? ORDER BY is_default DESC, company_name ASC',
      [customerId]
    );
    
    // 返回开票信息列表
    res.json(invoiceInfos);
  } catch (error) {
    console.error('获取客户开票信息错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 创建客户开票信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function createCustomerInvoiceInfo(req, res) {
  try {
    const { customerId } = req.params;
    const { company_name, tax_number, bank_name, bank_account, address, phone, is_default } = req.body;
    
    // 验证必填字段
    if (!company_name) {
      return res.status(400).json({ message: '公司名称为必填项' });
    }
    
    // 检查客户是否存在
    const [existingCustomers] = await pool.execute(
      'SELECT customer_id FROM customers WHERE customer_id = ?',
      [customerId]
    );
    
    if (existingCustomers.length === 0) {
      return res.status(404).json({ message: '客户不存在' });
    }
    
    // 如果设置为默认，先将其他开票信息设为非默认
    if (is_default) {
      await pool.execute(
        'UPDATE invoice_infos SET is_default = 0 WHERE customer_id = ?',
        [customerId]
      );
    }
    
    // 插入开票信息记录
    const [result] = await pool.execute(
      'INSERT INTO invoice_infos (customer_id, company_name, tax_number, bank_name, bank_account, address, phone, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [customerId, company_name, tax_number || null, bank_name || null, bank_account || null, address || null, phone || null, is_default ? 1 : 0]
    );
    
    // 获取新创建的开票信息
    const [invoiceInfos] = await pool.execute(
      'SELECT id, customer_id, company_name, tax_number, bank_name, bank_account, address, phone, is_default, created_at FROM invoice_infos WHERE id = ?',
      [result.insertId]
    );
    
    // 返回新开票信息
    res.status(201).json(invoiceInfos[0]);
  } catch (error) {
    console.error('创建客户开票信息错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 更新客户开票信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function updateCustomerInvoiceInfo(req, res) {
  try {
    const { customerId, infoId } = req.params;
    const { company_name, tax_number, bank_name, bank_account, address, phone, is_default } = req.body;
    
    // 验证必填字段
    if (!company_name) {
      return res.status(400).json({ message: '公司名称为必填项' });
    }
    
    // 检查开票信息是否存在且属于该客户
    const [existingInfos] = await pool.execute(
      'SELECT id FROM invoice_infos WHERE id = ? AND customer_id = ?',
      [infoId, customerId]
    );
    
    if (existingInfos.length === 0) {
      return res.status(404).json({ message: '开票信息不存在或不属于该客户' });
    }
    
    // 如果设置为默认，先将其他开票信息设为非默认
    if (is_default) {
      await pool.execute(
        'UPDATE invoice_infos SET is_default = 0 WHERE customer_id = ?',
        [customerId]
      );
    }
    
    // 更新开票信息记录
    await pool.execute(
      'UPDATE invoice_infos SET company_name = ?, tax_number = ?, bank_name = ?, bank_account = ?, address = ?, phone = ?, is_default = ? WHERE id = ?',
      [company_name, tax_number || null, bank_name || null, bank_account || null, address || null, phone || null, is_default ? 1 : 0, infoId]
    );
    
    // 获取更新后的开票信息
    const [invoiceInfos] = await pool.execute(
      'SELECT id, customer_id, company_name, tax_number, bank_name, bank_account, address, phone, is_default, created_at FROM invoice_infos WHERE id = ?',
      [infoId]
    );
    
    // 返回更新后的开票信息
    res.json(invoiceInfos[0]);
  } catch (error) {
    console.error('更新客户开票信息错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

/**
 * 删除客户开票信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function deleteCustomerInvoiceInfo(req, res) {
  try {
    const { customerId, infoId } = req.params;
    
    // 检查开票信息是否存在且属于该客户
    const [existingInfos] = await pool.execute(
      'SELECT id, is_default FROM invoice_infos WHERE id = ? AND customer_id = ?',
      [infoId, customerId]
    );
    
    if (existingInfos.length === 0) {
      return res.status(404).json({ message: '开票信息不存在或不属于该客户' });
    }
    
    // 检查是否有关联的发票
    const [invoices] = await pool.execute(
      'SELECT invoice_id FROM invoices WHERE invoice_info_id = ? LIMIT 1',
      [infoId]
    );
    
    if (invoices.length > 0) {
      return res.status(400).json({ message: '无法删除开票信息，存在关联的发票' });
    }
    
    // 删除开票信息记录
    await pool.execute(
      'DELETE FROM invoice_infos WHERE id = ?',
      [infoId]
    );
    
    // 如果删除的是默认开票信息，将客户的第一个开票信息设为默认（如果有）
    if (existingInfos[0].is_default) {
      const [remainingInfos] = await pool.execute(
        'SELECT id FROM invoice_infos WHERE customer_id = ? LIMIT 1',
        [customerId]
      );
      
      if (remainingInfos.length > 0) {
        await pool.execute(
          'UPDATE invoice_infos SET is_default = 1 WHERE id = ?',
          [remainingInfos[0].id]
        );
      }
    }
    
    // 返回成功消息
    res.json({ message: '开票信息删除成功' });
  } catch (error) {
    console.error('删除客户开票信息错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerInvoiceInfos,
  createCustomerInvoiceInfo,
  updateCustomerInvoiceInfo,
  deleteCustomerInvoiceInfo
};
