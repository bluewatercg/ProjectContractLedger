/**
 * 统计服务
 * 处理与数据统计相关的API请求
 */
import ApiService from './api.js';

class StatisticsService extends ApiService {
  constructor() {
    super();
    this.endpoint = '/statistics';
  }

  /**
   * 获取仪表盘概览数据
   * @returns {Promise<Object>} - 仪表盘数据
   */
  async getDashboardOverview() {
    return this.get(`${this.endpoint}/dashboard`);
  }

  /**
   * 获取按月份的收入统计
   * @param {number} year - 年份，默认为当前年份
   * @returns {Promise<Array>} - 月度收入数据
   */
  async getMonthlyRevenue(year = new Date().getFullYear()) {
    return this.get(`${this.endpoint}/revenue/monthly?year=${year}`);
  }

  /**
   * 获取按客户的收入统计
   * @param {number} limit - 限制返回的客户数量，默认为10
   * @returns {Promise<Array>} - 客户收入数据
   */
  async getRevenueByCustomer(limit = 10) {
    return this.get(`${this.endpoint}/revenue/customer?limit=${limit}`);
  }

  /**
   * 获取合同状态统计
   * @returns {Promise<Object>} - 合同状态数据
   */
  async getContractStatusStats() {
    return this.get(`${this.endpoint}/contracts/status`);
  }

  /**
   * 获取发票状态统计
   * @returns {Promise<Object>} - 发票状态数据
   */
  async getInvoiceStatusStats() {
    return this.get(`${this.endpoint}/invoices/status`);
  }

  /**
   * 获取应收账款账龄分析
   * @returns {Promise<Array>} - 账龄分析数据
   */
  async getAccountsReceivableAging() {
    return this.get(`${this.endpoint}/invoices/aging`);
  }

  /**
   * 获取即将到期的合同
   * @param {number} days - 天数阈值，默认为30天
   * @returns {Promise<Array>} - 即将到期的合同列表
   */
  async getExpiringContracts(days = 30) {
    return this.get(`${this.endpoint}/contracts/expiring?days=${days}`);
  }

  /**
   * 获取逾期未付的发票
   * @returns {Promise<Array>} - 逾期未付的发票列表
   */
  async getOverdueInvoices() {
    return this.get(`${this.endpoint}/invoices/overdue`);
  }
}

export default new StatisticsService(); 