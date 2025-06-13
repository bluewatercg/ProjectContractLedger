import { Provide, Inject } from '@midwayjs/core';
import { CustomerService } from './customer.service';
import { ContractService } from './contract.service';
import { InvoiceService } from './invoice.service';
import { PaymentService } from './payment.service';

// 简单的内存缓存接口
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem>();

  set(key: string, data: any, ttlSeconds = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

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

  // 缓存实例
  private cache = new SimpleCache();

  /**
   * 获取仪表板统计数据（带缓存优化）
   */
  async getDashboardStats(): Promise<any> {
    const cacheKey = 'dashboard_stats';

    // 尝试从缓存获取数据
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      console.log('Dashboard stats served from cache');
      return cachedData;
    }

    console.log('Fetching fresh dashboard stats from database');
    const startTime = Date.now();

    const [customerStats, contractStats, invoiceStats, paymentStats] =
      await Promise.all([
        this.getCustomerStats(),
        this.contractService.getContractStats(),
        this.invoiceService.getInvoiceStats(),
        this.paymentService.getPaymentStats(),
      ]);

    const result = {
      customers: customerStats,
      contracts: contractStats,
      invoices: invoiceStats,
      payments: paymentStats,
      summary: {
        totalRevenue: contractStats.totalAmount,
        paidAmount: invoiceStats.paidAmount,
        unpaidAmount: invoiceStats.unpaidAmount,
        activeCustomers: customerStats.active,
        activeContracts: contractStats.active,
      },
    };

    const endTime = Date.now();
    console.log(`Dashboard stats query took ${endTime - startTime}ms`);

    // 缓存结果，TTL为5分钟
    this.cache.set(cacheKey, result, 300);

    return result;
  }

  /**
   * 获取客户统计数据（使用优化后的方法）
   */
  private async getCustomerStats(): Promise<any> {
    return await this.customerService.getCustomerStats();
  }

  /**
   * 清除统计数据缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Statistics cache cleared');
  }

  /**
   * 清除特定缓存项
   */
  clearCacheItem(key: string): void {
    this.cache.delete(key);
    console.log(`Cache item '${key}' cleared`);
  }

  /**
   * 获取月度收入趋势
   */
  async getMonthlyRevenueTrend(months = 12): Promise<any[]> {
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
        payments: Math.floor(Math.random() * 30),
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
        { region: '其他', count: 22 },
      ],
      bySize: [
        { size: '大型企业', count: 30 },
        { size: '中型企业', count: 45 },
        { size: '小型企业', count: 25 },
      ],
    };
  }

  /**
   * 获取合同状态分布
   */
  async getContractStatusDistribution(): Promise<any> {
    const stats = await this.contractService.getContractStats();

    return [
      {
        status: '草稿',
        count: stats.draft,
        percentage: ((stats.draft / stats.total) * 100).toFixed(1),
      },
      {
        status: '执行中',
        count: stats.active,
        percentage: ((stats.active / stats.total) * 100).toFixed(1),
      },
      {
        status: '已完成',
        count: stats.completed,
        percentage: ((stats.completed / stats.total) * 100).toFixed(1),
      },
    ];
  }

  /**
   * 获取发票状态分布
   */
  async getInvoiceStatusDistribution(): Promise<any> {
    const stats = await this.invoiceService.getInvoiceStats();

    return [
      {
        status: '草稿',
        count: stats.draft,
        percentage: ((stats.draft / stats.total) * 100).toFixed(1),
      },
      {
        status: '已发送',
        count: stats.sent,
        percentage: ((stats.sent / stats.total) * 100).toFixed(1),
      },
      {
        status: '已支付',
        count: stats.paid,
        percentage: ((stats.paid / stats.total) * 100).toFixed(1),
      },
      {
        status: '逾期',
        count: stats.overdue,
        percentage: ((stats.overdue / stats.total) * 100).toFixed(1),
      },
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
      totalAmount: overdueInvoices.reduce(
        (sum, invoice) => sum + invoice.total_amount,
        0
      ),
      invoices: overdueInvoices.slice(0, 5), // 只返回前5个最紧急的
    };
  }
}
