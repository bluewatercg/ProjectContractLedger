/**
 * 客户合同管理系统 - API工具函数
 * 用于与后端API进行交互
 */

// 导入配置
// const CONFIG = window.CONFIG || {};

/**
 * API请求工具类
 */
class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || CONFIG.API_BASE_URL || 'http://localhost:8080/api/v1';
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * 设置认证令牌
   * @param {string} token JWT令牌
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * 获取请求头
   * @returns {Object} 请求头对象
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  /**
   * 处理API响应
   * @param {Response} response Fetch API响应对象
   * @returns {Promise} 处理后的响应数据
   */
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      // 处理401未授权错误
      if (response.status === 401) {
        this.setToken(null);
        window.location.href = '/index.html'; // 重定向到登录页
      }
      
      // 抛出错误
      const error = new Error(data.message || '请求失败');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  }

  /**
   * 发送GET请求
   * @param {string} endpoint API端点
   * @param {Object} params URL查询参数
   * @returns {Promise} 响应数据
   */
  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // 添加查询参数
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    return this.handleResponse(response);
  }

  /**
   * 发送POST请求
   * @param {string} endpoint API端点
   * @param {Object} data 请求数据
   * @returns {Promise} 响应数据
   */
  async post(endpoint, data = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    return this.handleResponse(response);
  }

  /**
   * 发送PUT请求
   * @param {string} endpoint API端点
   * @param {Object} data 请求数据
   * @returns {Promise} 响应数据
   */
  async put(endpoint, data = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    return this.handleResponse(response);
  }

  /**
   * 发送DELETE请求
   * @param {string} endpoint API端点
   * @returns {Promise} 响应数据
   */
  async delete(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    
    return this.handleResponse(response);
  }

  /**
   * 上传文件
   * @param {string} endpoint API端点
   * @param {FormData} formData 包含文件的表单数据
   * @returns {Promise} 响应数据
   */
  async uploadFile(endpoint, formData) {
    const headers = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    
    return this.handleResponse(response);
  }
}

// 创建API服务实例
const api = new ApiService();

/**
 * 认证相关API
 */
const authApi = {
  /**
   * 用户登录
   * @param {string} username 用户名
   * @param {string} password 密码
   * @returns {Promise} 登录结果
   */
  login: async (username, password) => {
    const data = await api.post('/auth/login', { username, password });
    if (data.access_token) {
      api.setToken(data.access_token);
    }
    return data;
  },
  
  /**
   * 用户登出
   */
  logout: () => {
    api.setToken(null);
    window.location.href = '/index.html';
  }
};

/**
 * 客户相关API
 */
const customerApi = {
  /**
   * 获取客户列表
   * @param {Object} params 查询参数
   * @returns {Promise} 客户列表
   */
  getCustomers: (params) => api.get('/customers', params),
  
  /**
   * 获取客户详情
   * @param {number} id 客户ID
   * @returns {Promise} 客户详情
   */
  getCustomer: (id) => api.get(`/customers/${id}`),
  
  /**
   * 创建客户
   * @param {Object} customer 客户数据
   * @returns {Promise} 创建结果
   */
  createCustomer: (customer) => api.post('/customers', customer),
  
  /**
   * 更新客户
   * @param {number} id 客户ID
   * @param {Object} customer 客户数据
   * @returns {Promise} 更新结果
   */
  updateCustomer: (id, customer) => api.put(`/customers/${id}`, customer),
  
  /**
   * 删除客户
   * @param {number} id 客户ID
   * @returns {Promise} 删除结果
   */
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
  
  /**
   * 获取客户的发票信息列表
   * @param {number} customerId 客户ID
   * @returns {Promise} 发票信息列表
   */
  getInvoiceInfos: (customerId) => api.get(`/customers/${customerId}/invoice-infos`),
  
  /**
   * 创建客户发票信息
   * @param {number} customerId 客户ID
   * @param {Object} invoiceInfo 发票信息数据
   * @returns {Promise} 创建结果
   */
  createInvoiceInfo: (customerId, invoiceInfo) => api.post(`/customers/${customerId}/invoice-infos`, invoiceInfo),
};

/**
 * 合同相关API
 */
const contractApi = {
  /**
   * 获取合同列表
   * @param {Object} params 查询参数
   * @returns {Promise} 合同列表
   */
  getContracts: (params) => api.get('/contracts', params),
  
  /**
   * 获取合同详情
   * @param {number} id 合同ID
   * @returns {Promise} 合同详情
   */
  getContract: (id) => api.get(`/contracts/${id}`),
  
  /**
   * 创建合同
   * @param {Object} contract 合同数据
   * @returns {Promise} 创建结果
   */
  createContract: (contract) => api.post('/contracts', contract),
  
  /**
   * 更新合同
   * @param {number} id 合同ID
   * @param {Object} contract 合同数据
   * @returns {Promise} 更新结果
   */
  updateContract: (id, contract) => api.put(`/contracts/${id}`, contract),
  
  /**
   * 删除合同
   * @param {number} id 合同ID
   * @returns {Promise} 删除结果
   */
  deleteContract: (id) => api.delete(`/contracts/${id}`),
  
  /**
   * 上传合同附件
   * @param {number} id 合同ID
   * @param {FormData} formData 包含文件的表单数据
   * @returns {Promise} 上传结果
   */
  uploadAttachment: (id, formData) => api.uploadFile(`/contracts/${id}/attachments`, formData),
};

/**
 * 发票相关API
 */
const invoiceApi = {
  /**
   * 获取发票列表
   * @param {Object} params 查询参数
   * @returns {Promise} 发票列表
   */
  getInvoices: (params) => api.get('/invoices', params),
  
  /**
   * 获取发票详情
   * @param {number} id 发票ID
   * @returns {Promise} 发票详情
   */
  getInvoice: (id) => api.get(`/invoices/${id}`),
  
  /**
   * 创建发票
   * @param {Object} invoice 发票数据
   * @returns {Promise} 创建结果
   */
  createInvoice: (invoice) => api.post('/invoices', invoice),
  
  /**
   * 更新发票
   * @param {number} id 发票ID
   * @param {Object} invoice 发票数据
   * @returns {Promise} 更新结果
   */
  updateInvoice: (id, invoice) => api.put(`/invoices/${id}`, invoice),
  
  /**
   * 删除发票
   * @param {number} id 发票ID
   * @returns {Promise} 删除结果
   */
  deleteInvoice: (id) => api.delete(`/invoices/${id}`),
  
  /**
   * 上传发票附件
   * @param {number} id 发票ID
   * @param {FormData} formData 包含文件的表单数据
   * @returns {Promise} 上传结果
   */
  uploadAttachment: (id, formData) => api.uploadFile(`/invoices/${id}/attachments`, formData),
};

/**
 * 付款相关API
 */
const paymentApi = {
  /**
   * 获取付款列表
   * @param {Object} params 查询参数
   * @returns {Promise} 付款列表
   */
  getPayments: (params) => api.get('/payments', params),
  
  /**
   * 获取付款详情
   * @param {number} id 付款ID
   * @returns {Promise} 付款详情
   */
  getPayment: (id) => api.get(`/payments/${id}`),
  
  /**
   * 创建付款
   * @param {Object} payment 付款数据
   * @returns {Promise} 创建结果
   */
  createPayment: (payment) => api.post('/payments', payment),
  
  /**
   * 更新付款
   * @param {number} id 付款ID
   * @param {Object} payment 付款数据
   * @returns {Promise} 更新结果
   */
  updatePayment: (id, payment) => api.put(`/payments/${id}`, payment),
  
  /**
   * 删除付款
   * @param {number} id 付款ID
   * @returns {Promise} 删除结果
   */
  deletePayment: (id) => api.delete(`/payments/${id}`),
};

/**
 * 统计相关API
 */
const statisticsApi = {
  /**
   * 获取仪表盘数据
   * @returns {Promise} 仪表盘数据
   */
  getDashboardData: () => api.get('/statistics/dashboard'),
  
  /**
   * 获取合同统计数据
   * @param {Object} params 查询参数
   * @returns {Promise} 合同统计数据
   */
  getContractStats: (params) => api.get('/statistics/contracts', params),
  
  /**
   * 获取发票统计数据
   * @param {Object} params 查询参数
   * @returns {Promise} 发票统计数据
   */
  getInvoiceStats: (params) => api.get('/statistics/invoices', params),
  
  /**
   * 获取付款统计数据
   * @param {Object} params 查询参数
   * @returns {Promise} 付款统计数据
   */
  getPaymentStats: (params) => api.get('/statistics/payments', params),
};