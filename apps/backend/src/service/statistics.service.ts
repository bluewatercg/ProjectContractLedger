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
  async getDashboardStats(year?: number, kitId?: number): Promise<any> {
    const cacheKey = kitId
      ? (year ? `dashboard_stats_${kitId}_${year}` : `dashboard_stats_${kitId}`)
      : (year ? `dashboard_stats_${year}` : 'dashboard_stats');

    // 在获取统计数据前，触发合同状态检查（自动完成已到期且结清的合同）
    try {
      await this.contractService.checkAndCompleteEligibleContracts(kitId);
    } catch (e) {
      console.error('Failed to auto-complete contracts:', e);
    }

    // 尝试从缓存获取数据
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      console.log(
        `Dashboard stats served from cache${year ? ` (${year})` : ''} for kit ${kitId}`
      );
      return cachedData;
    }

    console.log(
      `Fetching fresh dashboard stats from database${year ? ` for year ${year}` : ''} for kit ${kitId}`
    );
    const startTime = Date.now();

    const [customerStats, contractStats, invoiceStats, paymentStats] =
      await Promise.all([
        this.customerService.getCustomerStats(kitId),
        this.contractService.getContractStats(year, kitId),
        this.invoiceService.getInvoiceStats(year, kitId),
        this.paymentService.getPaymentStats(year, kitId),
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
    this.cache.clear(); // 简单起见，清除所有统计缓存
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
  async getMonthlyRevenueTrend(year: number, kitId?: number): Promise<any[]> {
    const result = [];

    // 统计发票面额总计（应收）
    const invoiceQuery = this.invoiceService.invoiceRepository
      .createQueryBuilder('invoice')
      .select("DATE_FORMAT(invoice.issue_date, '%Y-%m')", 'month')
      .addSelect('SUM(invoice.total_amount)', 'total')
      .where('YEAR(invoice.issue_date) = :year', { year });

    if (kitId) {
      invoiceQuery.andWhere('invoice.kit_id = :kitId', { kitId });
    }

    const invoiceTrend = await invoiceQuery
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    // 统计支付总计（实收）
    const paymentQuery = this.paymentService.paymentRepository
      .createQueryBuilder('payment')
      .select("DATE_FORMAT(payment.payment_date, '%Y-%m')", 'month')
      .addSelect('SUM(payment.amount)', 'total')
      .where('YEAR(payment.payment_date) = :year', { year })
      .andWhere("payment.status = 'completed'");

    if (kitId) {
      paymentQuery.andWhere('payment.kit_id = :kitId', { kitId });
    }

    const paymentTrend = await paymentQuery
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
  async getCustomerContribution(year: number, kitId?: number, limit = 5): Promise<any[]> {
    const query = this.invoiceService.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoin('invoice.contract', 'contract')
      .leftJoin('contract.customer', 'customer')
      .select('customer.name', 'name')
      .addSelect('SUM(invoice.total_amount)', 'total')
      .where('YEAR(invoice.issue_date) = :year', { year });

    if (kitId) {
      query.andWhere('invoice.kit_id = :kitId', { kitId });
    }

    const result = await query
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
  async getContractStatusDistribution(year: number, kitId?: number): Promise<any> {
    const stats = await this.contractService.getContractStats(year, kitId);

    return [
      {
        status: '草稿',
        count: stats.draft,
        percentage: stats.total > 0 ? ((stats.draft / stats.total) * 100).toFixed(1) : '0.0',
      },
      {
        status: '执行中',
        count: stats.active,
        percentage: stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : '0.0',
      },
      {
        status: '已完成',
        count: stats.completed,
        percentage: stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0.0',
      },
    ];
  }

  /**
   * 获取发票状态分布
   */
  async getInvoiceStatusDistribution(year: number, kitId?: number): Promise<any> {
    const stats = await this.invoiceService.getInvoiceStats(year, kitId);

    return [
      {
        status: '草稿',
        count: stats.draft,
        percentage: stats.total > 0 ? ((stats.draft / stats.total) * 100).toFixed(1) : '0.0',
      },
      {
        status: '已发送',
        count: stats.sent,
        percentage: stats.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(1) : '0.0',
      },
      {
        status: '已支付',
        count: stats.paid,
        percentage: stats.total > 0 ? ((stats.paid / stats.total) * 100).toFixed(1) : '0.0',
      },
      {
        status: '逾期',
        count: stats.overdue,
        percentage: stats.total > 0 ? ((stats.overdue / stats.total) * 100).toFixed(1) : '0.0',
      },
    ];
  }

  /**
   * 获取支付方式统计
   */
  async getPaymentMethodStats(kitId?: number): Promise<any> {
    const stats = await this.paymentService.getPaymentStats(undefined, kitId);
    return stats.paymentMethodStats;
  }

  /**
   * 获取逾期发票提醒
   */
  async getOverdueInvoicesAlert(kitId?: number): Promise<any> {
    const overdueInvoices = await this.invoiceService.getOverdueInvoices(kitId);

    return {
      count: overdueInvoices.length,
      totalAmount: overdueInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.total_amount),
        0
      ),
      invoices: overdueInvoices.slice(0, 5),
    };
  }

  /**
   * 获取可用年份列表
   */
  async getAvailableYears(kitId?: number): Promise<number[]> {
    const contractQuery = this.contractService.contractRepository
      .createQueryBuilder('contract')
      .select('MIN(YEAR(contract.start_date))', 'minYear');

    const invoiceQuery = this.invoiceService.invoiceRepository
      .createQueryBuilder('invoice')
      .select('MIN(YEAR(invoice.issue_date))', 'minYear');

    if (kitId) {
      contractQuery.andWhere('contract.kit_id = :kitId', { kitId });
      invoiceQuery.andWhere('invoice.kit_id = :kitId', { kitId });
    }

    const [minContractYear, minInvoiceYear] = await Promise.all([
      contractQuery.getRawOne(),
      invoiceQuery.getRawOne(),
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

    return years.reverse();
  }
}
