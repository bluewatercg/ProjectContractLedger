/**
 * 付款服务
 * 处理与付款相关的API请求
 */
import ApiService from './api.js';

class PaymentService extends ApiService {
  constructor() {
    super();
    this.endpoint = '/payments';
  }

  /**
   * 获取所有付款记录
   * @returns {Promise<Array>} - 付款记录列表
   */
  async getAllPayments() {
    return this.get(this.endpoint);
  }

  /**
   * 获取单个付款记录
   * @param {number} id - 付款记录ID
   * @returns {Promise<Object>} - 付款记录信息
   */
  async getPaymentById(id) {
    return this.get(`${this.endpoint}/${id}`);
  }

  /**
   * 创建付款记录
   * @param {Object} paymentData - 付款记录数据
   * @returns {Promise<Object>} - 创建结果
   */
  async createPayment(paymentData) {
    return this.post(this.endpoint, paymentData);
  }

  /**
   * 更新付款记录
   * @param {number} id - 付款记录ID
   * @param {Object} paymentData - 付款记录数据
   * @returns {Promise<Object>} - 更新结果
   */
  async updatePayment(id, paymentData) {
    return this.put(`${this.endpoint}/${id}`, paymentData);
  }

  /**
   * 删除付款记录
   * @param {number} id - 付款记录ID
   * @returns {Promise<Object>} - 删除结果
   */
  async deletePayment(id) {
    return this.delete(`${this.endpoint}/${id}`);
  }

  /**
   * 获取发票的所有付款记录
   * @param {number} invoiceId - 发票ID
   * @returns {Promise<Array>} - 付款记录列表
   */
  async getPaymentsByInvoice(invoiceId) {
    return this.get(`${this.endpoint}?invoiceId=${invoiceId}`);
  }

  /**
   * 获取合同的所有付款记录
   * @param {number} contractId - 合同ID
   * @returns {Promise<Array>} - 付款记录列表
   */
  async getPaymentsByContract(contractId) {
    return this.get(`${this.endpoint}?contractId=${contractId}`);
  }

  /**
   * 获取客户的所有付款记录
   * @param {number} customerId - 客户ID
   * @returns {Promise<Array>} - 付款记录列表
   */
  async getPaymentsByCustomer(customerId) {
    return this.get(`${this.endpoint}?customerId=${customerId}`);
  }

  /**
   * 获取指定日期范围内的付款记录
   * @param {string} startDate - 开始日期，格式为YYYY-MM-DD
   * @param {string} endDate - 结束日期，格式为YYYY-MM-DD
   * @returns {Promise<Array>} - 付款记录列表
   */
  async getPaymentsByDateRange(startDate, endDate) {
    return this.get(`${this.endpoint}?startDate=${startDate}&endDate=${endDate}`);
  }
}

export default new PaymentService(); 