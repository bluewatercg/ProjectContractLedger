import { Provide, Inject } from '@midwayjs/core';
import { CustomerService } from './customer.service';
import { ContractService } from './contract.service';
import { InvoiceService } from './invoice.service';
import { PaymentService } from './payment.service';

@Provide()
export class StatisticsService {
  @Inject()
  customerService: CustomerService;

  @Inject()
  contractService: ContractService;

  @Inject()
  invoiceService: InvoiceService;

  @Inject()
  paymentService: PaymentService;

  /**
   * 获取仪表板统计数据
   */
  async getDashboardStats(): Promise<any> {
    const [
      customerStats,
      contractStats,
      invoiceStats,
      paymentStats
    ] = await Promise.all([
      this.getCustomerStats(),
      this.contractService.getContractStats(),
      this.invoiceService.getInvoiceStats(),
      this.paymentService.getPaymentStats()
    ]);

    return {
      customers: customerStats,
      contracts: contractStats,
      invoices: invoiceStats,
      payments: paymentStats,
      summary: {
        totalRevenue: contractStats.totalAmount,
        paidAmount: invoiceStats.paidAmount,
        unpaidAmount: invoiceStats.unpaidAmount,
        activeCustomers: customerStats.active,
        activeContracts: contractStats.active
      }
    };
  }

  /**
   * 获取客户统计数据
   */
  private async getCustomerStats(): Promise<any> {
    const total = await this.customerService.getActiveCustomersCount();
    const active = await this.customerService.getCustomersByStatus('active');
    const inactive = await this.customerService.getCustomersByStatus('inactive');

    return {
      total,
      active: active.length,
      inactive: inactive.length
    };
  }

  /**
   * 获取月度收入趋势
   */
  async getMonthlyRevenueTrend(months: number = 12): Promise<any[]> {
    // 这里需要根据实际需求实现月度收入统计
    // 可以基于合同签订时间、发票开具时间或支付时间来统计
    const result = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      // 这里应该查询数据库获取实际数据
      // 暂时返回模拟数据
      result.push({
        year,
        month,
        monthName: date.toLocaleDateString('zh-CN', { month: 'long' }),
        revenue: Math.random() * 100000,
        contracts: Math.floor(Math.random() * 20),
        payments: Math.floor(Math.random() * 30)
      });
    }
    
    return result;
  }

  /**
   * 获取客户分布统计
   */
  async getCustomerDistribution(): Promise<any> {
    // 按地区、行业等维度统计客户分布
    // 这里需要根据实际的客户数据结构来实现
    return {
      byRegion: [
        { region: '北京', count: 25 },
        { region: '上海', count: 20 },
        { region: '广州', count: 15 },
        { region: '深圳', count: 18 },
        { region: '其他', count: 22 }
      ],
      bySize: [
        { size: '大型企业', count: 30 },
        { size: '中型企业', count: 45 },
        { size: '小型企业', count: 25 }
      ]
    };
  }

  /**
   * 获取合同状态分布
   */
  async getContractStatusDistribution(): Promise<any> {
    const stats = await this.contractService.getContractStats();
    
    return [
      { status: '草稿', count: stats.draft, percentage: (stats.draft / stats.total * 100).toFixed(1) },
      { status: '执行中', count: stats.active, percentage: (stats.active / stats.total * 100).toFixed(1) },
      { status: '已完成', count: stats.completed, percentage: (stats.completed / stats.total * 100).toFixed(1) }
    ];
  }

  /**
   * 获取发票状态分布
   */
  async getInvoiceStatusDistribution(): Promise<any> {
    const stats = await this.invoiceService.getInvoiceStats();
    
    return [
      { status: '草稿', count: stats.draft, percentage: (stats.draft / stats.total * 100).toFixed(1) },
      { status: '已发送', count: stats.sent, percentage: (stats.sent / stats.total * 100).toFixed(1) },
      { status: '已支付', count: stats.paid, percentage: (stats.paid / stats.total * 100).toFixed(1) },
      { status: '逾期', count: stats.overdue, percentage: (stats.overdue / stats.total * 100).toFixed(1) }
    ];
  }

  /**
   * 获取支付方式统计
   */
  async getPaymentMethodStats(): Promise<any> {
    const stats = await this.paymentService.getPaymentStats();
    return stats.paymentMethodStats;
  }

  /**
   * 获取逾期发票提醒
   */
  async getOverdueInvoicesAlert(): Promise<any> {
    const overdueInvoices = await this.invoiceService.getOverdueInvoices();
    
    return {
      count: overdueInvoices.length,
      totalAmount: overdueInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0),
      invoices: overdueInvoices.slice(0, 5) // 只返回前5个最紧急的
    };
  }
}
