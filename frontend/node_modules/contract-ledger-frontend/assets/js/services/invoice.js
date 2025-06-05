/**
 * 发票服务
 * 处理与发票相关的API请求
 */
import ApiService from './api.js';

class InvoiceService extends ApiService {
  constructor() {
    super();
    this.endpoint = '/invoices';
  }

  /**
   * 获取所有发票
   * @returns {Promise<Array>} - 发票列表
   */
  async getAllInvoices() {
    return this.get(this.endpoint);
  }

  /**
   * 获取单个发票
   * @param {number} id - 发票ID
   * @returns {Promise<Object>} - 发票信息
   */
  async getInvoiceById(id) {
    return this.get(`${this.endpoint}/${id}`);
  }

  /**
   * 创建发票
   * @param {Object} invoiceData - 发票数据
   * @returns {Promise<Object>} - 创建结果
   */
  async createInvoice(invoiceData) {
    return this.post(this.endpoint, invoiceData);
  }

  /**
   * 更新发票
   * @param {number} id - 发票ID
   * @param {Object} invoiceData - 发票数据
   * @returns {Promise<Object>} - 更新结果
   */
  async updateInvoice(id, invoiceData) {
    return this.put(`${this.endpoint}/${id}`, invoiceData);
  }

  /**
   * 删除发票
   * @param {number} id - 发票ID
   * @returns {Promise<Object>} - 删除结果
   */
  async deleteInvoice(id) {
    return this.delete(`${this.endpoint}/${id}`);
  }

  /**
   * 获取合同的所有发票
   * @param {number} contractId - 合同ID
   * @returns {Promise<Array>} - 发票列表
   */
  async getInvoicesByContract(contractId) {
    return this.get(`${this.endpoint}?contractId=${contractId}`);
  }

  /**
   * 获取客户的所有发票
   * @param {number} customerId - 客户ID
   * @returns {Promise<Array>} - 发票列表
   */
  async getInvoicesByCustomer(customerId) {
    return this.get(`${this.endpoint}?customerId=${customerId}`);
  }

  /**
   * 获取待付款的发票
   * @returns {Promise<Array>} - 待付款发票列表
   */
  async getUnpaidInvoices() {
    return this.get(`${this.endpoint}/unpaid`);
  }
}

export default new InvoiceService(); 