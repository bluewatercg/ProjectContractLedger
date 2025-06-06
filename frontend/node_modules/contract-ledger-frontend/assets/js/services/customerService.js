/**
 * 客户管理服务类
 * 基于Swagger API文档的客户管理接口对接
 */

import { getApiConfig, API_ENDPOINTS } from '../config/api.js';

class CustomerService {
  constructor() {
    this.config = getApiConfig();
    this.baseUrl = this.config.baseUrl;
    this.token = this.getStoredToken();
  }

  /**
   * 获取存储的访问令牌
   * @returns {string|null} 访问令牌
   */
  getStoredToken() {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  }

  /**
   * 设置访问令牌
   * @param {string} token - 访问令牌
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  /**
   * 获取请求头
   * @returns {Object} 请求头对象
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * 发送HTTP请求的通用方法
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应数据
   */
  async request(url, options = {}) {
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(`${this.baseUrl}${url}`, config);
      
      // 处理401未授权错误
      if (response.status === 401) {
        this.clearToken();
        throw new Error('认证失败，请重新登录');
      }

      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }

  /**
   * 清除令牌
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
  }

  /**
   * 获取所有客户列表
   * @param {Object} params - 查询参数
   * @param {string} params.name - 客户名称模糊搜索
   * @param {number} params.page - 页码，默认为1
   * @param {number} params.pageSize - 每页数量，默认为10
   * @returns {Promise<Object>} 客户列表和分页信息
   */
  async getAllCustomers(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.name) queryParams.append('name', params.name);
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);

    const queryString = queryParams.toString();
    const url = `${API_ENDPOINTS.CUSTOMERS.LIST}${queryString ? `?${queryString}` : ''}`;

    return await this.request(url, {
      method: 'GET'
    });
  }

  /**
   * 根据ID获取单个客户
   * @param {number} customerId - 客户ID
   * @returns {Promise<Object>} 客户详细信息
   */
  async getCustomerById(customerId) {
    return await this.request(API_ENDPOINTS.CUSTOMERS.DETAIL(customerId), {
      method: 'GET'
    });
  }

  /**
   * 创建新客户
   * @param {Object} customerData - 客户数据
   * @param {string} customerData.name - 客户名称（必填）
   * @param {string} customerData.contact_person - 联系人
   * @param {string} customerData.phone - 联系电话
   * @param {string} customerData.email - 联系邮箱
   * @param {string} customerData.address - 客户地址
   * @param {string} customerData.notes - 备注信息
   * @returns {Promise<Object>} 创建的客户信息
   */
  async createCustomer(customerData) {
    return await this.request(API_ENDPOINTS.CUSTOMERS.CREATE, {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  }

  /**
   * 更新客户信息
   * @param {number} customerId - 客户ID
   * @param {Object} customerData - 更新的客户数据
   * @returns {Promise<Object>} 更新后的客户信息
   */
  async updateCustomer(customerId, customerData) {
    return await this.request(API_ENDPOINTS.CUSTOMERS.UPDATE(customerId), {
      method: 'PUT',
      body: JSON.stringify(customerData)
    });
  }

  /**
   * 删除客户
   * @param {number} customerId - 客户ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteCustomer(customerId) {
    return await this.request(API_ENDPOINTS.CUSTOMERS.DELETE(customerId), {
      method: 'DELETE'
    });
  }

  /**
   * 获取客户的开票信息列表
   * @param {number} customerId - 客户ID
   * @returns {Promise<Array>} 开票信息列表
   */
  async getCustomerInvoiceInfos(customerId) {
    return await this.request(`/customers/${customerId}/invoice-infos`, {
      method: 'GET'
    });
  }

  /**
   * 创建客户开票信息
   * @param {number} customerId - 客户ID
   * @param {Object} invoiceInfoData - 开票信息数据
   * @returns {Promise<Object>} 创建的开票信息
   */
  async createCustomerInvoiceInfo(customerId, invoiceInfoData) {
    return await this.request(`/customers/${customerId}/invoice-infos`, {
      method: 'POST',
      body: JSON.stringify(invoiceInfoData)
    });
  }

  /**
   * 更新客户开票信息
   * @param {number} customerId - 客户ID
   * @param {number} infoId - 开票信息ID
   * @param {Object} invoiceInfoData - 更新的开票信息数据
   * @returns {Promise<Object>} 更新后的开票信息
   */
  async updateCustomerInvoiceInfo(customerId, infoId, invoiceInfoData) {
    return await this.request(`/customers/${customerId}/invoice-infos/${infoId}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceInfoData)
    });
  }

  /**
   * 删除客户开票信息
   * @param {number} customerId - 客户ID
   * @param {number} infoId - 开票信息ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteCustomerInvoiceInfo(customerId, infoId) {
    return await this.request(`/customers/${customerId}/invoice-infos/${infoId}`, {
      method: 'DELETE'
    });
  }
}

export default CustomerService;
