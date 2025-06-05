/**
 * 客户管理服务使用示例
 * 演示如何使用CustomerService进行客户管理操作
 */

import CustomerService from '../services/customerService.js';

class CustomerServiceExample {
  constructor() {
    this.customerService = new CustomerService();
    
    // 设置您的访问令牌
    this.customerService.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHFpamkuY29tIiwiaWF0IjoxNzQ4OTM2MDg5LCJleHAiOjE3NDkwMjI0ODl9.W7dKfYNo5YL2Nwn622-yQB8_dGWCKkf9awdI8Hfm8mY');
  }

  /**
   * 示例1: 获取所有客户列表
   */
  async exampleGetAllCustomers() {
    try {
      console.log('=== 获取所有客户列表 ===');
      
      // 基本查询
      const allCustomers = await this.customerService.getAllCustomers();
      console.log('所有客户:', allCustomers);

      // 带分页的查询
      const pagedCustomers = await this.customerService.getAllCustomers({
        page: 1,
        pageSize: 5
      });
      console.log('分页客户列表:', pagedCustomers);

      // 带搜索条件的查询
      const searchCustomers = await this.customerService.getAllCustomers({
        name: '公司',
        page: 1,
        pageSize: 10
      });
      console.log('搜索结果:', searchCustomers);

    } catch (error) {
      console.error('获取客户列表失败:', error.message);
    }
  }

  /**
   * 示例2: 创建新客户
   */
  async exampleCreateCustomer() {
    try {
      console.log('=== 创建新客户 ===');
      
      const newCustomerData = {
        name: '示例科技有限公司',
        contact_person: '张三',
        phone: '13800138000',
        email: 'zhangsan@example.com',
        address: '北京市朝阳区示例大厦1001室',
        notes: '重要客户，优先处理'
      };

      const createdCustomer = await this.customerService.createCustomer(newCustomerData);
      console.log('创建的客户:', createdCustomer);
      
      return createdCustomer;

    } catch (error) {
      console.error('创建客户失败:', error.message);
    }
  }

  /**
   * 示例3: 获取单个客户详情
   */
  async exampleGetCustomerById(customerId) {
    try {
      console.log('=== 获取客户详情 ===');
      
      const customer = await this.customerService.getCustomerById(customerId);
      console.log('客户详情:', customer);
      
      return customer;

    } catch (error) {
      console.error('获取客户详情失败:', error.message);
    }
  }

  /**
   * 示例4: 更新客户信息
   */
  async exampleUpdateCustomer(customerId) {
    try {
      console.log('=== 更新客户信息 ===');
      
      const updateData = {
        name: '示例科技有限公司（已更新）',
        contact_person: '李四',
        phone: '13900139000',
        email: 'lisi@example.com',
        address: '上海市浦东新区示例园区2002室',
        notes: '已完成年度续约，VIP客户'
      };

      const updatedCustomer = await this.customerService.updateCustomer(customerId, updateData);
      console.log('更新后的客户:', updatedCustomer);
      
      return updatedCustomer;

    } catch (error) {
      console.error('更新客户失败:', error.message);
    }
  }

  /**
   * 示例5: 客户开票信息管理
   */
  async exampleManageInvoiceInfo(customerId) {
    try {
      console.log('=== 客户开票信息管理 ===');
      
      // 创建开票信息
      const invoiceInfoData = {
        company_name: '示例科技有限公司',
        tax_number: '91110000123456789X',
        bank_name: '中国银行',
        bank_account: '6222000012345678',
        address: '北京市朝阳区示例大厦1001室',
        phone: '010-12345678',
        is_default: true
      };

      const createdInvoiceInfo = await this.customerService.createCustomerInvoiceInfo(customerId, invoiceInfoData);
      console.log('创建的开票信息:', createdInvoiceInfo);

      // 获取客户的所有开票信息
      const invoiceInfos = await this.customerService.getCustomerInvoiceInfos(customerId);
      console.log('客户开票信息列表:', invoiceInfos);

      return createdInvoiceInfo;

    } catch (error) {
      console.error('开票信息管理失败:', error.message);
    }
  }

  /**
   * 示例6: 删除客户
   */
  async exampleDeleteCustomer(customerId) {
    try {
      console.log('=== 删除客户 ===');
      
      const result = await this.customerService.deleteCustomer(customerId);
      console.log('删除结果:', result);
      
      return result;

    } catch (error) {
      console.error('删除客户失败:', error.message);
    }
  }

  /**
   * 运行完整的示例流程
   */
  async runCompleteExample() {
    console.log('开始运行客户管理完整示例...\n');

    // 1. 获取现有客户列表
    await this.exampleGetAllCustomers();
    console.log('\n');

    // 2. 创建新客户
    const newCustomer = await this.exampleCreateCustomer();
    if (!newCustomer) return;
    console.log('\n');

    const customerId = newCustomer.customer_id;

    // 3. 获取新创建的客户详情
    await this.exampleGetCustomerById(customerId);
    console.log('\n');

    // 4. 更新客户信息
    await this.exampleUpdateCustomer(customerId);
    console.log('\n');

    // 5. 管理开票信息
    await this.exampleManageInvoiceInfo(customerId);
    console.log('\n');

    // 6. 最后删除测试客户（可选）
    // await this.exampleDeleteCustomer(customerId);

    console.log('客户管理示例运行完成！');
  }
}

// 使用示例
const example = new CustomerServiceExample();

// 运行完整示例
// example.runCompleteExample();

// 或者运行单个示例
// example.exampleGetAllCustomers();

export default CustomerServiceExample;
