/**
 * 客户管理API测试脚本
 * 基于您提供的curl命令和token进行API测试
 */

// 配置信息
const API_BASE_URL = 'http://127.0.0.1:8080/api/v1';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHFpamkuY29tIiwiaWF0IjoxNzQ4OTM2MDg5LCJleHAiOjE3NDkwMjI0ODl9.W7dKfYNo5YL2Nwn622-yQB8_dGWCKkf9awdI8Hfm8mY';

/**
 * 发送HTTP请求的通用函数
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    },
    ...options
  };

  try {
    console.log(`\n🚀 发送请求: ${config.method || 'GET'} ${url}`);
    if (config.body) {
      console.log('📤 请求体:', config.body);
    }

    const response = await fetch(url, config);
    const responseText = await response.text();
    
    console.log(`📊 响应状态: ${response.status} ${response.statusText}`);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('📥 响应数据:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('📥 响应内容:', responseText);
      responseData = responseText;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseData.message || responseText}`);
    }

    return responseData;
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    throw error;
  }
}

/**
 * 测试1: 获取所有客户列表
 */
async function testGetAllCustomers() {
  console.log('\n=== 测试1: 获取所有客户列表 ===');
  
  try {
    // 基本查询
    await apiRequest('/customers');
    
    // 带分页参数的查询
    await apiRequest('/customers?page=1&pageSize=5');
    
    // 带搜索条件的查询
    await apiRequest('/customers?name=公司&page=1&pageSize=10');
    
  } catch (error) {
    console.error('获取客户列表测试失败');
  }
}

/**
 * 测试2: 创建新客户
 */
async function testCreateCustomer() {
  console.log('\n=== 测试2: 创建新客户 ===');
  
  const customerData = {
    name: '测试客户公司',
    contact_person: '测试联系人',
    phone: '13800138000',
    email: 'test@example.com',
    address: '测试地址123号',
    notes: '这是一个测试客户'
  };

  try {
    const result = await apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
    
    return result.customer_id || result.id;
  } catch (error) {
    console.error('创建客户测试失败');
    return null;
  }
}

/**
 * 测试3: 获取单个客户详情
 */
async function testGetCustomerById(customerId) {
  console.log(`\n=== 测试3: 获取客户详情 (ID: ${customerId}) ===`);
  
  try {
    await apiRequest(`/customers/${customerId}`);
  } catch (error) {
    console.error('获取客户详情测试失败');
  }
}

/**
 * 测试4: 更新客户信息
 */
async function testUpdateCustomer(customerId) {
  console.log(`\n=== 测试4: 更新客户信息 (ID: ${customerId}) ===`);
  
  const updateData = {
    name: '测试客户公司（已更新）',
    contact_person: '更新后的联系人',
    phone: '13900139000',
    email: 'updated@example.com',
    address: '更新后的地址456号',
    notes: '这是更新后的测试客户'
  };

  try {
    await apiRequest(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  } catch (error) {
    console.error('更新客户测试失败');
  }
}

/**
 * 测试5: 客户开票信息管理
 */
async function testCustomerInvoiceInfo(customerId) {
  console.log(`\n=== 测试5: 客户开票信息管理 (客户ID: ${customerId}) ===`);
  
  try {
    // 获取客户开票信息列表
    console.log('\n📋 获取客户开票信息列表:');
    await apiRequest(`/customers/${customerId}/invoice-infos`);
    
    // 创建开票信息
    console.log('\n📝 创建开票信息:');
    const invoiceInfoData = {
      company_name: '测试开票公司',
      tax_number: '91110000123456789X',
      bank_name: '测试银行',
      bank_account: '6222000012345678',
      address: '开票地址123号',
      phone: '010-12345678',
      is_default: true
    };
    
    const invoiceInfo = await apiRequest(`/customers/${customerId}/invoice-infos`, {
      method: 'POST',
      body: JSON.stringify(invoiceInfoData)
    });
    
    const invoiceInfoId = invoiceInfo.id;
    
    // 更新开票信息
    if (invoiceInfoId) {
      console.log('\n✏️ 更新开票信息:');
      const updateInvoiceData = {
        company_name: '测试开票公司（已更新）',
        tax_number: '91110000987654321Y',
        bank_name: '更新后的银行',
        bank_account: '6222000087654321',
        address: '更新后的开票地址456号',
        phone: '010-87654321',
        is_default: false
      };
      
      await apiRequest(`/customers/${customerId}/invoice-infos/${invoiceInfoId}`, {
        method: 'PUT',
        body: JSON.stringify(updateInvoiceData)
      });
    }
    
    return invoiceInfoId;
  } catch (error) {
    console.error('开票信息管理测试失败');
    return null;
  }
}

/**
 * 测试6: 删除开票信息
 */
async function testDeleteInvoiceInfo(customerId, invoiceInfoId) {
  if (!invoiceInfoId) return;
  
  console.log(`\n=== 测试6: 删除开票信息 (客户ID: ${customerId}, 开票信息ID: ${invoiceInfoId}) ===`);
  
  try {
    await apiRequest(`/customers/${customerId}/invoice-infos/${invoiceInfoId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('删除开票信息测试失败');
  }
}

/**
 * 测试7: 删除客户
 */
async function testDeleteCustomer(customerId) {
  console.log(`\n=== 测试7: 删除客户 (ID: ${customerId}) ===`);
  
  try {
    await apiRequest(`/customers/${customerId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('删除客户测试失败');
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🎯 开始运行客户管理API测试...');
  console.log(`🔑 使用Token: ${ACCESS_TOKEN.substring(0, 50)}...`);
  
  try {
    // 1. 获取所有客户列表
    await testGetAllCustomers();
    
    // 2. 创建新客户
    const customerId = await testCreateCustomer();
    if (!customerId) {
      console.log('❌ 无法继续测试，因为客户创建失败');
      return;
    }
    
    // 3. 获取客户详情
    await testGetCustomerById(customerId);
    
    // 4. 更新客户信息
    await testUpdateCustomer(customerId);
    
    // 5. 开票信息管理
    const invoiceInfoId = await testCustomerInvoiceInfo(customerId);
    
    // 6. 删除开票信息
    await testDeleteInvoiceInfo(customerId, invoiceInfoId);
    
    // 7. 删除测试客户（可选）
    console.log('\n❓ 是否删除测试客户？（注释掉下面这行可保留测试数据）');
    // await testDeleteCustomer(customerId);
    
    console.log('\n✅ 所有测试完成！');
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
runAllTests();
