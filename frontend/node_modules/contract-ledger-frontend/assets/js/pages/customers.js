/**
 * 客户管理页面
 * 实现客户列表、搜索、添加、编辑和删除功能
 */
import Component from '../components/component.js';
import Table from '../components/table.js';
import Modal from '../components/modal.js';
import Form from '../components/form.js';
import customerService from '../services/customer.js';
import { formatDate } from '../utils/formatter.js';
import * as validator from '../utils/validator.js';

class CustomersPage extends Component {
  constructor(el) {
    super(el);
    this.customers = [];
    this.loading = true;
    this.searchTerm = '';
    this.currentCustomer = null;
  }

  async initialize() {
    this.render();
    this.initComponents();
    await this.loadCustomers();
  }

  /**
   * 加载客户数据
   */
  async loadCustomers() {
    try {
      this.loading = true;
      this.customerTable.setLoading(true);
      
      this.customers = await customerService.getAllCustomers();
      
      this.loading = false;
      this.filterAndRenderCustomers();
    } catch (error) {
      console.error('加载客户数据失败:', error);
      window.showAlert('error', '加载客户数据失败，请稍后重试');
      
      this.loading = false;
      this.customerTable.setLoading(false);
    }
  }

  /**
   * 渲染页面
   */
  render() {
    const template = `
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">客户管理</h1>
          <p class="text-gray-600">管理您的客户信息</p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button id="addCustomerBtn" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            <i class="fas fa-plus mr-2"></i>新增客户
          </button>
        </div>
      </div>

      <!-- 搜索和筛选 -->
      <div class="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <label for="searchInput" class="block text-sm font-medium text-gray-700 mb-1">搜索客户</label>
            <div class="relative">
              <input
                id="searchInput"
                type="text"
                placeholder="输入客户名称、联系人或电话搜索"
                class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <button id="clearSearchBtn" class="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 客户列表 -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div id="customerTable"></div>
      </div>

      <!-- 客户表单模态框 -->
      <div id="customerModal" class="hidden">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 id="modalTitle" class="text-lg font-semibold text-gray-900">新增客户</h3>
            <button data-close class="text-gray-400 hover:text-gray-500 focus:outline-none">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form id="customerForm" class="space-y-4">
            <input type="hidden" name="customer_id">
            
            <div class="form-group">
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">客户名称 <span class="text-red-500">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入客户名称"
                required
              >
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-group">
                <label for="contact_person" class="block text-sm font-medium text-gray-700 mb-1">联系人 <span class="text-red-500">*</span></label>
                <input
                  type="text"
                  id="contact_person"
                  name="contact_person"
                  class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入联系人姓名"
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="contact_phone" class="block text-sm font-medium text-gray-700 mb-1">联系电话 <span class="text-red-500">*</span></label>
                <input
                  type="text"
                  id="contact_phone"
                  name="contact_phone"
                  class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入联系电话"
                  required
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">电子邮箱</label>
              <input
                type="email"
                id="email"
                name="email"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入电子邮箱"
              >
            </div>
            
            <div class="form-group">
              <label for="address" class="block text-sm font-medium text-gray-700 mb-1">地址</label>
              <input
                type="text"
                id="address"
                name="address"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入地址"
              >
            </div>
            
            <div class="form-group">
              <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入备注信息"
              ></textarea>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                data-close
                class="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                取消
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 删除确认模态框 -->
      <div id="deleteModal" class="hidden">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">确认删除</h3>
            <button data-close class="text-gray-400 hover:text-gray-500 focus:outline-none">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="py-3">
            <p class="text-gray-700">确定要删除这个客户吗？此操作不可撤销。</p>
            <p class="text-sm text-gray-500 mt-2">删除客户将同时删除与该客户相关的所有合同、发票和付款记录。</p>
          </div>
          
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              data-close
              class="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              取消
            </button>
            <button
              id="confirmDeleteBtn"
              type="button"
              class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    `;

    this.el.innerHTML = template;
  }

  /**
   * 初始化组件
   */
  initComponents() {
    // 客户表格
    this.customerTable = new Table('#customerTable', {
      columns: [
        { key: 'name', label: '客户名称', sortable: true },
        { key: 'contact_person', label: '联系人', sortable: true },
        { key: 'contact_phone', label: '联系电话' },
        { key: 'email', label: '电子邮箱' },
        { key: 'created_at', label: '创建时间', sortable: true, render: value => formatDate(value) },
        { 
          key: 'actions', 
          label: '操作', 
          render: (_, row) => `
            <div class="flex space-x-2">
              <button class="edit-btn text-blue-600 hover:text-blue-900" data-id="${row.customer_id}">
                <i class="fas fa-edit"></i>
              </button>
              <a href="customer-detail.html?id=${row.customer_id}" class="text-green-600 hover:text-green-900">
                <i class="fas fa-eye"></i>
              </a>
              <button class="delete-btn text-red-600 hover:text-red-900" data-id="${row.customer_id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `
        }
      ],
      emptyMessage: '没有客户数据',
      loading: true,
      onRowClick: (row) => {
        window.location.href = `customer-detail.html?id=${row.customer_id}`;
      }
    });
    
    // 客户表单模态框
    this.customerModal = new Modal('#customerModal');
    
    // 删除确认模态框
    this.deleteModal = new Modal('#deleteModal');
    
    // 客户表单
    this.customerForm = new Form('#customerForm', {
      fields: [
        { 
          name: 'name', 
          validators: [
            validator.required,
            validator.maxLength(100)
          ]
        },
        { 
          name: 'contact_person', 
          validators: [
            validator.required,
            validator.maxLength(50)
          ]
        },
        { 
          name: 'contact_phone', 
          validators: [
            validator.required,
            validator.phone
          ]
        },
        { 
          name: 'email', 
          validators: [
            validator.email
          ]
        }
      ],
      onSubmit: this.handleSubmitCustomer.bind(this)
    });
    
    // 绑定事件
    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 添加客户按钮
    const addCustomerBtn = this.el.querySelector('#addCustomerBtn');
    addCustomerBtn.addEventListener('click', () => this.showCustomerForm());
    
    // 搜索输入框
    const searchInput = this.el.querySelector('#searchInput');
    searchInput.addEventListener('input', () => {
      this.searchTerm = searchInput.value.trim().toLowerCase();
      this.filterAndRenderCustomers();
    });
    
    // 清除搜索按钮
    const clearSearchBtn = this.el.querySelector('#clearSearchBtn');
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      this.searchTerm = '';
      this.filterAndRenderCustomers();
    });
    
    // 编辑按钮
    this.el.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.edit-btn');
      if (editBtn) {
        e.stopPropagation(); // 阻止冒泡到行点击事件
        const customerId = editBtn.dataset.id;
        this.editCustomer(customerId);
      }
    });
    
    // 删除按钮
    this.el.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.delete-btn');
      if (deleteBtn) {
        e.stopPropagation(); // 阻止冒泡到行点击事件
        const customerId = deleteBtn.dataset.id;
        this.showDeleteConfirm(customerId);
      }
    });
    
    // 确认删除按钮
    const confirmDeleteBtn = this.el.querySelector('#confirmDeleteBtn');
    confirmDeleteBtn.addEventListener('click', () => this.deleteCustomer());
  }

  /**
   * 过滤并渲染客户列表
   */
  filterAndRenderCustomers() {
    let filteredCustomers = this.customers;
    
    // 应用搜索过滤
    if (this.searchTerm) {
      filteredCustomers = this.customers.filter(customer => 
        customer.name.toLowerCase().includes(this.searchTerm) ||
        customer.contact_person.toLowerCase().includes(this.searchTerm) ||
        customer.contact_phone.includes(this.searchTerm)
      );
    }
    
    this.customerTable.updateData(filteredCustomers);
  }

  /**
   * 显示客户表单
   * @param {Object} customer - 客户数据，为空时表示新增客户
   */
  showCustomerForm(customer = null) {
    this.currentCustomer = customer;
    
    // 重置表单
    const form = this.el.querySelector('#customerForm');
    form.reset();
    
    if (customer) {
      // 编辑客户
      this.el.querySelector('#modalTitle').textContent = '编辑客户';
      
      // 填充表单
      form.elements.customer_id.value = customer.customer_id;
      form.elements.name.value = customer.name;
      form.elements.contact_person.value = customer.contact_person;
      form.elements.contact_phone.value = customer.contact_phone;
      form.elements.email.value = customer.email || '';
      form.elements.address.value = customer.address || '';
      form.elements.notes.value = customer.notes || '';
    } else {
      // 新增客户
      this.el.querySelector('#modalTitle').textContent = '新增客户';
      form.elements.customer_id.value = '';
    }
    
    this.customerModal.open();
  }

  /**
   * 处理客户表单提交
   * @param {Object} formData - 表单数据
   */
  async handleSubmitCustomer(formData) {
    try {
      if (formData.customer_id) {
        // 更新客户
        await customerService.updateCustomer(formData.customer_id, formData);
        window.showAlert('success', '客户更新成功');
      } else {
        // 创建客户
        await customerService.createCustomer(formData);
        window.showAlert('success', '客户创建成功');
      }
      
      // 关闭模态框
      this.customerModal.close();
      
      // 重新加载客户列表
      await this.loadCustomers();
    } catch (error) {
      console.error('保存客户失败:', error);
      window.showAlert('error', '保存客户失败，请稍后重试');
    }
  }

  /**
   * 编辑客户
   * @param {string} customerId - 客户ID
   */
  async editCustomer(customerId) {
    try {
      const customer = await customerService.getCustomerById(customerId);
      this.showCustomerForm(customer);
    } catch (error) {
      console.error('获取客户信息失败:', error);
      window.showAlert('error', '获取客户信息失败，请稍后重试');
    }
  }

  /**
   * 显示删除确认对话框
   * @param {string} customerId - 客户ID
   */
  async showDeleteConfirm(customerId) {
    try {
      const customer = await customerService.getCustomerById(customerId);
      this.currentCustomer = customer;
      this.deleteModal.open();
    } catch (error) {
      console.error('获取客户信息失败:', error);
      window.showAlert('error', '获取客户信息失败，请稍后重试');
    }
  }

  /**
   * 删除客户
   */
  async deleteCustomer() {
    if (!this.currentCustomer) return;
    
    try {
      await customerService.deleteCustomer(this.currentCustomer.customer_id);
      
      // 关闭模态框
      this.deleteModal.close();
      
      // 显示成功提示
      window.showAlert('success', '客户删除成功');
      
      // 重新加载客户列表
      await this.loadCustomers();
    } catch (error) {
      console.error('删除客户失败:', error);
      window.showAlert('error', '删除客户失败，请稍后重试');
    }
  }
}

export default CustomersPage; 