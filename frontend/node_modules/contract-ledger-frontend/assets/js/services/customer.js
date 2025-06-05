/**
 * 客户服务
 * 处理与客户相关的API请求
 */
import ApiService from './api.js';

class CustomerService extends ApiService {
  constructor() {
    super();
    this.endpoint = '/customers';
  }

  /**
   * 获取所有客户
   * @returns {Promise<Array>} - 客户列表
   */
  async getAllCustomers() {
    return this.get(this.endpoint);
  }

  /**
   * 获取单个客户
   * @param {number} id - 客户ID
   * @returns {Promise<Object>} - 客户信息
   */
  async getCustomerById(id) {
    return this.get(`${this.endpoint}/${id}`);
  }

  /**
   * 创建客户
   * @param {Object} customerData - 客户数据
   * @returns {Promise<Object>} - 创建结果
   */
  async createCustomer(customerData) {
    return this.post(this.endpoint, customerData);
  }

  /**
   * 更新客户
   * @param {number} id - 客户ID
   * @param {Object} customerData - 客户数据
   * @returns {Promise<Object>} - 更新结果
   */
  async updateCustomer(id, customerData) {
    return this.put(`${this.endpoint}/${id}`, customerData);
  }

  /**
   * 删除客户
   * @param {number} id - 客户ID
   * @returns {Promise<Object>} - 删除结果
   */
  async deleteCustomer(id) {
    return this.delete(`${this.endpoint}/${id}`);
  }

  /**
   * 获取客户开票信息
   * @param {number} customerId - 客户ID
   * @returns {Promise<Array>} - 开票信息列表
   */
  async getCustomerInvoiceInfos(customerId) {
    return this.get(`${this.endpoint}/${customerId}/invoice-infos`);
  }

  /**
   * 创建客户开票信息
   * @param {number} customerId - 客户ID
   * @param {Object} infoData - 开票信息数据
   * @returns {Promise<Object>} - 创建结果
   */
  async createCustomerInvoiceInfo(customerId, infoData) {
    return this.post(`${this.endpoint}/${customerId}/invoice-infos`, infoData);
  }

  /**
   * 更新客户开票信息
   * @param {number} customerId - 客户ID
   * @param {number} infoId - 开票信息ID
   * @param {Object} infoData - 开票信息数据
   * @returns {Promise<Object>} - 更新结果
   */
  async updateCustomerInvoiceInfo(customerId, infoId, infoData) {
    return this.put(`${this.endpoint}/${customerId}/invoice-infos/${infoId}`, infoData);
  }

  /**
   * 删除客户开票信息
   * @param {number} customerId - 客户ID
   * @param {number} infoId - 开票信息ID
   * @returns {Promise<Object>} - 删除结果
   */
  async deleteCustomerInvoiceInfo(customerId, infoId) {
    return this.delete(`${this.endpoint}/${customerId}/invoice-infos/${infoId}`);
  }
}

export default new CustomerService(); 