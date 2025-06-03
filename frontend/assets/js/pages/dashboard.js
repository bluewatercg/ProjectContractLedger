/**
 * 仪表盘页面
 * 显示系统概览数据
 */
import Component from '../components/component.js';
import Card from '../components/card.js';
import Table from '../components/table.js';
import statisticsService from '../services/statistics.js';
import contractService from '../services/contract.js';
import invoiceService from '../services/invoice.js';
import { formatDate, formatMoney } from '../utils/formatter.js';

class DashboardPage extends Component {
  constructor(el) {
    super(el);
    this.overviewData = null;
    this.expiringContracts = [];
    this.overdueInvoices = [];
    this.loading = {
      overview: true,
      expiringContracts: true,
      overdueInvoices: true
    };
  }

  async initialize() {
    this.render();
    await this.loadData();
  }

  /**
   * 加载数据
   */
  async loadData() {
    try {
      // 加载概览数据
      this.overviewData = await statisticsService.getDashboardOverview();
      this.loading.overview = false;
      this.updateOverviewCards();
      
      // 加载即将到期的合同
      this.expiringContracts = await statisticsService.getExpiringContracts(30);
      this.loading.expiringContracts = false;
      this.renderExpiringContracts();
      
      // 加载逾期未付的发票
      this.overdueInvoices = await statisticsService.getOverdueInvoices();
      this.loading.overdueInvoices = false;
      this.renderOverdueInvoices();
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
      window.showAlert('error', '加载数据失败，请稍后重试');
      
      // 设置加载状态为false，显示空数据
      this.loading = {
        overview: false,
        expiringContracts: false,
        overdueInvoices: false
      };
      
      this.updateOverviewCards();
      this.renderExpiringContracts();
      this.renderOverdueInvoices();
    }
  }

  /**
   * 渲染页面
   */
  render() {
    const template = `
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">仪表盘</h1>
        <p class="text-gray-600">欢迎回来，这是您的业务概览</p>
      </div>

      <!-- 快捷操作 -->
      <div class="mb-8">
        <div class="flex flex-wrap gap-4">
          <a href="customer-create.html" class="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto">
            <i class="fas fa-user-plus text-blue-500 mr-2"></i>
            <span>新增客户</span>
          </a>
          <a href="contract-create.html" class="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto">
            <i class="fas fa-file-signature text-green-500 mr-2"></i>
            <span>创建合同</span>
          </a>
          <a href="invoice-create.html" class="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto">
            <i class="fas fa-file-invoice-dollar text-purple-500 mr-2"></i>
            <span>记录开票</span>
          </a>
          <a href="payment-create.html" class="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto">
            <i class="fas fa-hand-holding-usd text-yellow-500 mr-2"></i>
            <span>记录到款</span>
          </a>
        </div>
      </div>

      <!-- 数据概览 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div id="customerCard"></div>
        <div id="contractCard"></div>
        <div id="invoiceCard"></div>
        <div id="paymentCard"></div>
      </div>

      <!-- 待办提醒 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 即将到期的合同 -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">即将到期的合同</h2>
          <div id="expiringContractsTable" class="bg-white rounded-lg shadow-sm overflow-hidden"></div>
        </div>

        <!-- 逾期未付的发票 -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">逾期未付的发票</h2>
          <div id="overdueInvoicesTable" class="bg-white rounded-lg shadow-sm overflow-hidden"></div>
        </div>
      </div>
    `;

    this.el.innerHTML = template;
    this.initCards();
    this.initTables();
  }

  /**
   * 初始化卡片
   */
  initCards() {
    // 客户卡片
    this.customerCard = new Card('#customerCard', {
      title: '客户总数',
      icon: '<i class="fas fa-users"></i>',
      value: '加载中...',
      loading: true
    });
    
    // 合同卡片
    this.contractCard = new Card('#contractCard', {
      title: '合同总数',
      icon: '<i class="fas fa-file-contract"></i>',
      value: '加载中...',
      loading: true
    });
    
    // 发票卡片
    this.invoiceCard = new Card('#invoiceCard', {
      title: '本月开票',
      icon: '<i class="fas fa-file-invoice"></i>',
      value: '加载中...',
      loading: true
    });
    
    // 付款卡片
    this.paymentCard = new Card('#paymentCard', {
      title: '本月到款',
      icon: '<i class="fas fa-money-bill-wave"></i>',
      value: '加载中...',
      loading: true
    });
  }

  /**
   * 初始化表格
   */
  initTables() {
    // 即将到期的合同表格
    this.expiringContractsTable = new Table('#expiringContractsTable', {
      columns: [
        { key: 'contract_name', label: '合同名称', sortable: true },
        { key: 'customer_name', label: '客户名称', sortable: true },
        { key: 'end_date', label: '到期日期', sortable: true, render: value => formatDate(value) },
        { key: 'days_left', label: '剩余天数', sortable: true },
        { 
          key: 'actions', 
          label: '操作', 
          render: (_, row) => `
            <a href="contract-detail.html?id=${row.contract_id}" class="text-blue-600 hover:text-blue-900">
              <i class="fas fa-eye"></i>
            </a>
          `
        }
      ],
      emptyMessage: '没有即将到期的合同',
      loading: true,
      onRowClick: (row) => {
        window.location.href = `contract-detail.html?id=${row.contract_id}`;
      }
    });
    
    // 逾期未付的发票表格
    this.overdueInvoicesTable = new Table('#overdueInvoicesTable', {
      columns: [
        { key: 'invoice_number', label: '发票号', sortable: true },
        { key: 'customer_name', label: '客户名称', sortable: true },
        { key: 'amount', label: '金额', sortable: true, render: value => formatMoney(value) },
        { key: 'due_date', label: '截止日期', sortable: true, render: value => formatDate(value) },
        { key: 'overdue_days', label: '逾期天数', sortable: true },
        { 
          key: 'actions', 
          label: '操作', 
          render: (_, row) => `
            <a href="invoice-detail.html?id=${row.invoice_id}" class="text-blue-600 hover:text-blue-900">
              <i class="fas fa-eye"></i>
            </a>
          `
        }
      ],
      emptyMessage: '没有逾期未付的发票',
      loading: true,
      onRowClick: (row) => {
        window.location.href = `invoice-detail.html?id=${row.invoice_id}`;
      }
    });
  }

  /**
   * 更新概览卡片
   */
  updateOverviewCards() {
    if (!this.loading.overview && this.overviewData) {
      // 更新客户卡片
      this.customerCard.update({
        value: this.overviewData.customer_count,
        subtitle: '本月新增',
        trend: this.overviewData.customer_growth > 0 ? 1 : -1,
        trendValue: `${Math.abs(this.overviewData.customer_growth)}`
      });
      
      // 更新合同卡片
      this.contractCard.update({
        value: this.overviewData.contract_count,
        subtitle: '本月新增',
        trend: this.overviewData.contract_growth > 0 ? 1 : -1,
        trendValue: `${Math.abs(this.overviewData.contract_growth)}`
      });
      
      // 更新发票卡片
      this.invoiceCard.update({
        value: formatMoney(this.overviewData.monthly_invoice_amount),
        subtitle: '相比上月',
        trend: this.overviewData.invoice_growth > 0 ? 1 : -1,
        trendValue: `${Math.abs(this.overviewData.invoice_growth)}%`
      });
      
      // 更新付款卡片
      this.paymentCard.update({
        value: formatMoney(this.overviewData.monthly_payment_amount),
        subtitle: '相比上月',
        trend: this.overviewData.payment_growth > 0 ? 1 : -1,
        trendValue: `${Math.abs(this.overviewData.payment_growth)}%`
      });
    } else {
      // 设置加载状态
      this.customerCard.setLoading(this.loading.overview);
      this.contractCard.setLoading(this.loading.overview);
      this.invoiceCard.setLoading(this.loading.overview);
      this.paymentCard.setLoading(this.loading.overview);
      
      if (!this.loading.overview) {
        // 加载失败，显示默认值
        this.customerCard.update({ value: '0', subtitle: '' });
        this.contractCard.update({ value: '0', subtitle: '' });
        this.invoiceCard.update({ value: '¥0', subtitle: '' });
        this.paymentCard.update({ value: '¥0', subtitle: '' });
      }
    }
  }

  /**
   * 渲染即将到期的合同
   */
  renderExpiringContracts() {
    this.expiringContractsTable.setLoading(this.loading.expiringContracts);
    if (!this.loading.expiringContracts) {
      this.expiringContractsTable.updateData(this.expiringContracts);
    }
  }

  /**
   * 渲染逾期未付的发票
   */
  renderOverdueInvoices() {
    this.overdueInvoicesTable.setLoading(this.loading.overdueInvoices);
    if (!this.loading.overdueInvoices) {
      this.overdueInvoicesTable.updateData(this.overdueInvoices);
    }
  }
}

export default DashboardPage; 