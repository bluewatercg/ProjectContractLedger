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
  async getDashboardStats(year?: number): Promise<any> {
    const cacheKey = year ? `dashboard_stats_${year}` : 'dashboard_stats';

    // 尝试从缓存获取数据
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      console.log(
        `Dashboard stats served from cache${year ? ` (${year})` : ''}`
      );
      return cachedData;
    }

    console.log(
      `Fetching fresh dashboard stats from database${year ? ` for year ${year}` : ''}`
    );
    const startTime = Date.now();

    const [customerStats, contractStats, invoiceStats, paymentStats] =
      await Promise.all([
        this.customerService.getCustomerStats(),
        this.contractService.getContractStats(year),
        this.invoiceService.getInvoiceStats(year),
        this.paymentService.getPaymentStats(year),
      ]);

    const result = {
      customers: customerStats,
      contracts: contractStats,
      invoices: invoiceStats,
      payments: paymentStats,
      summary: {
        totalRevenue: contractStats.totalAmount,
        invoicedAmount: invoiceStats.totalAmount,
        paidAmount: paymentStats.totalAmount,
        unpaidAmount: Math.max(
          0,
          invoiceStats.totalAmount - paymentStats.totalAmount
        ),
        uninvoicedAmount: Math.max(
          0,
          contractStats.totalAmount - invoiceStats.totalAmount
        ),
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
   * 清除仪表板相关缓存（当数据变更时调用）
   */
  invalidateDashboardCache(): void {
    this.cache.delete('dashboard_stats');
    console.log('Dashboard cache invalidated due to data changes');
  }

  /**
   * 当客户数据变更时清除相关缓存
   */
  invalidateCustomerCache(): void {
    this.invalidateDashboardCache();
    console.log('Customer-related cache invalidated');
  }

  /**
   * 当合同数据变更时清除相关缓存
   */
  invalidateContractCache(): void {
    this.invalidateDashboardCache();
    console.log('Contract-related cache invalidated');
  }

  /**
   * 当发票数据变更时清除相关缓存
   */
  invalidateInvoiceCache(): void {
    this.invalidateDashboardCache();
    console.log('Invoice-related cache invalidated');
  }

  /**
   * 当支付数据变更时清除相关缓存
   */
  invalidatePaymentCache(): void {
    this.invalidateDashboardCache();
    console.log('Payment-related cache invalidated');
  }

  /**
   * 获取月度收入趋势（固定12个月）
   */
  async getMonthlyRevenueTrend(year: number): Promise<any[]> {
    const result = [];

    // 统计发票面额总计（应收）
    const invoiceTrend = await this.invoiceService.invoiceRepository
      .createQueryBuilder('invoice')
      .select("DATE_FORMAT(invoice.issue_date, '%Y-%m')", 'month')
      .addSelect('SUM(invoice.total_amount)', 'total')
      .where('YEAR(invoice.issue_date) = :year', { year })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    // 统计支付总计（实收）
    const paymentTrend = await this.paymentService.paymentRepository
      .createQueryBuilder('payment')
      .select("DATE_FORMAT(payment.payment_date, '%Y-%m')", 'month')
      .addSelect('SUM(payment.amount)', 'total')
      .where('YEAR(payment.payment_date) = :year', { year })
      .andWhere("payment.status = 'completed'")
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    // 生成12个月的数据
    for (let month = 1; month <= 12; month++) {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const inv = invoiceTrend.find(t => t.month === monthStr);
      const pay = paymentTrend.find(t => t.month === monthStr);

      const date = new Date(year, month - 1, 1);
      result.push({
        month: monthStr,
        monthName: date.toLocaleDateString('zh-CN', { month: 'short' }),
        revenue: parseFloat(inv?.total) || 0,
        payments: parseFloat(pay?.total) || 0,
      });
    }

    return result;
  }

  /**
   * 获取客户分布统计
   */
  async getCustomerContribution(year: number, limit = 5): Promise<any[]> {
    const result = await this.invoiceService.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoin('invoice.contract', 'contract')
      .leftJoin('contract.customer', 'customer')
      .select('customer.name', 'name')
      .addSelect('SUM(invoice.total_amount)', 'total')
      .where('YEAR(invoice.issue_date) = :year', { year })
      .groupBy('customer.id')
      .orderBy('total', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map(r => ({
      name: r.name,
      total: parseFloat(r.total) || 0,
    }));
  }

  /**
   * 获取合同状态分布
   */
  async getContractStatusDistribution(year: number): Promise<any> {
    const stats = await this.contractService.getContractStats(year);

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
  async getInvoiceStatusDistribution(year: number): Promise<any> {
    const stats = await this.invoiceService.getInvoiceStats(year);

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

  /**
   * 获取可用年份列表
   */
  async getAvailableYears(): Promise<number[]> {
    const [minContractYear, minInvoiceYear] = await Promise.all([
      this.contractService.contractRepository
        .createQueryBuilder('contract')
        .select('MIN(YEAR(contract.start_date))', 'minYear')
        .getRawOne(),
      this.invoiceService.invoiceRepository
        .createQueryBuilder('invoice')
        .select('MIN(YEAR(invoice.issue_date))', 'minYear')
        .getRawOne(),
    ]);

    const minYear = Math.min(
      minContractYear.minYear || new Date().getFullYear(),
      minInvoiceYear.minYear || new Date().getFullYear()
    );
    const currentYear = new Date().getFullYear();

    const years = [];
    for (let y = minYear; y <= currentYear; y++) {
      years.push(y);
    }

    return years.reverse(); // 降序排列，当前年最前
  }
}
