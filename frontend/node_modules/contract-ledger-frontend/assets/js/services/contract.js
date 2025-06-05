/**
 * 合同服务
 * 处理与合同相关的API请求
 */
import ApiService from './api.js';

class ContractService extends ApiService {
  constructor() {
    super();
    this.endpoint = '/contracts';
  }

  /**
   * 获取所有合同
   * @returns {Promise<Array>} - 合同列表
   */
  async getAllContracts() {
    return this.get(this.endpoint);
  }

  /**
   * 获取单个合同
   * @param {number} id - 合同ID
   * @returns {Promise<Object>} - 合同信息
   */
  async getContractById(id) {
    return this.get(`${this.endpoint}/${id}`);
  }

  /**
   * 创建合同
   * @param {Object} contractData - 合同数据
   * @returns {Promise<Object>} - 创建结果
   */
  async createContract(contractData) {
    return this.post(this.endpoint, contractData);
  }

  /**
   * 更新合同
   * @param {number} id - 合同ID
   * @param {Object} contractData - 合同数据
   * @returns {Promise<Object>} - 更新结果
   */
  async updateContract(id, contractData) {
    return this.put(`${this.endpoint}/${id}`, contractData);
  }

  /**
   * 删除合同
   * @param {number} id - 合同ID
   * @returns {Promise<Object>} - 删除结果
   */
  async deleteContract(id) {
    return this.delete(`${this.endpoint}/${id}`);
  }

  /**
   * 获取即将到期的合同
   * @param {number} days - 天数阈值，默认为30天
   * @returns {Promise<Array>} - 即将到期的合同列表
   */
  async getExpiringContracts(days = 30) {
    return this.get(`${this.endpoint}/expiring?days=${days}`);
  }

  /**
   * 获取客户的所有合同
   * @param {number} customerId - 客户ID
   * @returns {Promise<Array>} - 合同列表
   */
  async getContractsByCustomer(customerId) {
    return this.get(`${this.endpoint}?customerId=${customerId}`);
  }
}

export default new ContractService(); 