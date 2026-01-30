import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../entity/contract.entity';
import { Invoice } from '../entity/invoice.entity';
import { Payment } from '../entity/payment.entity';
import { Reconciliation } from '../entity/reconciliation.entity';
import {
  ReportQueryParams,
  ContractReportData,
  InvoiceReportData,
  PaymentReportData,
  ReconciliationReportData,
  ReportDataItem,
} from '../interface';

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
export class ReportService {
  @InjectEntityModel(Contract)
  contractRepository: Repository<Contract>;

  @InjectEntityModel(Invoice)
  invoiceRepository: Repository<Invoice>;

  @InjectEntityModel(Payment)
  paymentRepository: Repository<Payment>;

  @InjectEntityModel(Reconciliation)
  reconciliationRepository: Repository<Reconciliation>;

  // 缓存实例
  private cache = new SimpleCache();

  /**
   * 获取合同报表
   */
  async getContractReport(
    params: ReportQueryParams
  ): Promise<ContractReportData> {
    const cacheKey = `contract_report_${JSON.stringify(params)}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const { startDate, endDate, groupBy = 'month', kitId } = params;

    // 构建基础查询
    const baseQuery = this.contractRepository.createQueryBuilder('contract');

    if (kitId) {
      baseQuery.andWhere('contract.kit_id = :kitId', { kitId });
    }

    if (startDate) {
      baseQuery.andWhere('contract.start_date >= :startDate', { startDate });
    }

    if (endDate) {
      baseQuery.andWhere('contract.start_date <= :endDate', { endDate });
    }

    // 获取汇总数据
    const summaryQuery = baseQuery.clone();
    const summaryResult = await summaryQuery
      .select('COUNT(*)', 'totalCount')
      .addSelect('SUM(contract.total_amount)', 'totalAmount')
      .addSelect(
        "SUM(CASE WHEN contract.status = 'active' THEN 1 ELSE 0 END)",
        'activeCount'
      )
      .addSelect(
        "SUM(CASE WHEN contract.status = 'completed' THEN 1 ELSE 0 END)",
        'completedCount'
      )
      .getRawOne();

    const summary = {
      totalCount: parseInt(summaryResult.totalCount) || 0,
      totalAmount: parseFloat(summaryResult.totalAmount) || 0,
      activeCount: parseInt(summaryResult.activeCount) || 0,
      completedCount: parseInt(summaryResult.completedCount) || 0,
      averageAmount:
        parseInt(summaryResult.totalCount) > 0
          ? parseFloat(summaryResult.totalAmount) /
            parseInt(summaryResult.totalCount)
          : 0,
    };

    // 获取趋势数据
    const trend = await this.getContractTrend(params);

    // 获取状态分布
    const statusDistribution = await this.getContractStatusDistribution(
      params
    );

    const result = {
      summary,
      trend,
      statusDistribution,
    };

    // 缓存结果，TTL为5分钟
    this.cache.set(cacheKey, result, 300);

    return result;
  }

  /**
   * 获取发票报表
   */
  async getInvoiceReport(params: ReportQueryParams): Promise<InvoiceReportData> {
    const cacheKey = `invoice_report_${JSON.stringify(params)}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const { startDate, endDate, groupBy = 'month', kitId } = params;

    // 构建基础查询
    const baseQuery = this.invoiceRepository.createQueryBuilder('invoice');

    if (kitId) {
      baseQuery.andWhere('invoice.kit_id = :kitId', { kitId });
    }

    if (startDate) {
      baseQuery.andWhere('invoice.issue_date >= :startDate', { startDate });
    }

    if (endDate) {
      baseQuery.andWhere('invoice.issue_date <= :endDate', { endDate });
    }

    // 获取汇总数据
    const summaryQuery = baseQuery.clone();
    const summaryResult = await summaryQuery
      .select('COUNT(*)', 'totalCount')
      .addSelect('SUM(invoice.total_amount)', 'totalAmount')
      .addSelect(
        "SUM(CASE WHEN invoice.status = 'paid' THEN 1 ELSE 0 END)",
        'paidCount'
      )
      .addSelect(
        "SUM(CASE WHEN invoice.status = 'paid' THEN invoice.total_amount ELSE 0 END)",
        'paidAmount'
      )
      .addSelect(
        "SUM(CASE WHEN invoice.status = 'overdue' THEN 1 ELSE 0 END)",
        'overdueCount'
      )
      .addSelect(
        "SUM(CASE WHEN invoice.status = 'overdue' THEN invoice.total_amount ELSE 0 END)",
        'overdueAmount'
      )
      .getRawOne();

    const totalAmount = parseFloat(summaryResult.totalAmount) || 0;
    const paidAmount = parseFloat(summaryResult.paidAmount) || 0;

    const summary = {
      totalCount: parseInt(summaryResult.totalCount) || 0,
      totalAmount,
      paidCount: parseInt(summaryResult.paidCount) || 0,
      paidAmount,
      unpaidAmount: totalAmount - paidAmount,
      overdueCount: parseInt(summaryResult.overdueCount) || 0,
      overdueAmount: parseFloat(summaryResult.overdueAmount) || 0,
    };

    // 获取趋势数据
    const trend = await this.getInvoiceTrend(params);

    // 获取状态分布
    const statusDistribution = await this.getInvoiceStatusDistribution(params);

    const result = {
      summary,
      trend,
      statusDistribution,
    };

    // 缓存结果，TTL为5分钟
    this.cache.set(cacheKey, result, 300);

    return result;
  }

  /**
   * 获取支付报表
   */
  async getPaymentReport(params: ReportQueryParams): Promise<PaymentReportData> {
    const cacheKey = `payment_report_${JSON.stringify(params)}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const { startDate, endDate, groupBy = 'month', kitId } = params;

    // 构建基础查询
    const baseQuery = this.paymentRepository.createQueryBuilder('payment');

    if (kitId) {
      baseQuery.andWhere('payment.kit_id = :kitId', { kitId });
    }

    if (startDate) {
      baseQuery.andWhere('payment.payment_date >= :startDate', { startDate });
    }

    if (endDate) {
      baseQuery.andWhere('payment.payment_date <= :endDate', { endDate });
    }

    // 获取汇总数据
    const summaryQuery = baseQuery.clone();
    const summaryResult = await summaryQuery
      .select('COUNT(*)', 'totalCount')
      .addSelect('SUM(payment.amount)', 'totalAmount')
      .addSelect(
        "SUM(CASE WHEN payment.status = 'completed' THEN 1 ELSE 0 END)",
        'completedCount'
      )
      .addSelect(
        "SUM(CASE WHEN payment.status = 'completed' THEN payment.amount ELSE 0 END)",
        'completedAmount'
      )
      .getRawOne();

    const summary = {
      totalCount: parseInt(summaryResult.totalCount) || 0,
      totalAmount: parseFloat(summaryResult.totalAmount) || 0,
      completedCount: parseInt(summaryResult.completedCount) || 0,
      completedAmount: parseFloat(summaryResult.completedAmount) || 0,
      averageAmount:
        parseInt(summaryResult.completedCount) > 0
          ? parseFloat(summaryResult.completedAmount) /
            parseInt(summaryResult.completedCount)
          : 0,
    };

    // 获取趋势数据
    const trend = await this.getPaymentTrend(params);

    // 获取支付方式分布
    const methodDistribution = await this.getPaymentMethodDistribution(params);

    const result = {
      summary,
      trend,
      methodDistribution,
    };

    // 缓存结果，TTL为5分钟
    this.cache.set(cacheKey, result, 300);

    return result;
  }

  /**
   * 获取对账报表
   */
  async getReconciliationReport(
    params: ReportQueryParams
  ): Promise<ReconciliationReportData> {
    const cacheKey = `reconciliation_report_${JSON.stringify(params)}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const { startDate, endDate, groupBy = 'month', kitId } = params;

    // 构建基础查询
    const baseQuery =
      this.reconciliationRepository.createQueryBuilder('reconciliation');

    if (kitId) {
      baseQuery.andWhere('reconciliation.kit_id = :kitId', { kitId });
    }

    if (startDate) {
      baseQuery.andWhere('reconciliation.reconciled_at >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      baseQuery.andWhere('reconciliation.reconciled_at <= :endDate', {
        endDate,
      });
    }

    // 获取汇总数据
    const summaryQuery = baseQuery.clone();
    const summaryResult = await summaryQuery
      .select('COUNT(*)', 'totalCount')
      .addSelect(
        "SUM(CASE WHEN reconciliation.status = 'matched' THEN 1 ELSE 0 END)",
        'matchedCount'
      )
      .addSelect(
        "SUM(CASE WHEN reconciliation.status != 'matched' THEN 1 ELSE 0 END)",
        'unmatchedCount'
      )
      .addSelect('SUM(ABS(reconciliation.difference_amount))', 'totalDifference')
      .getRawOne();

    const summary = {
      totalCount: parseInt(summaryResult.totalCount) || 0,
      matchedCount: parseInt(summaryResult.matchedCount) || 0,
      unmatchedCount: parseInt(summaryResult.unmatchedCount) || 0,
      totalDifference: parseFloat(summaryResult.totalDifference) || 0,
    };

    // 获取趋势数据
    const trend = await this.getReconciliationTrend(params);

    // 获取状态分布
    const statusDistribution = await this.getReconciliationStatusDistribution(
      params
    );

    const result = {
      summary,
      trend,
      statusDistribution,
    };

    // 缓存结果，TTL为5分钟
    this.cache.set(cacheKey, result, 300);

    return result;
  }

  /**
   * 获取财务汇总报表
   */
  async getFinancialSummary(params: ReportQueryParams): Promise<any> {
    const cacheKey = `financial_summary_${JSON.stringify(params)}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // 并行获取各类报表数据
    const [contractReport, invoiceReport, paymentReport, reconciliationReport] =
      await Promise.all([
        this.getContractReport(params),
        this.getInvoiceReport(params),
        this.getPaymentReport(params),
        this.getReconciliationReport(params),
      ]);

    const result = {
      contracts: contractReport,
      invoices: invoiceReport,
      payments: paymentReport,
      reconciliations: reconciliationReport,
      financialHealth: {
        contractFulfillmentRate:
          contractReport.summary.totalCount > 0
            ? (contractReport.summary.completedCount /
                contractReport.summary.totalCount) *
              100
            : 0,
        invoicePaymentRate:
          invoiceReport.summary.totalCount > 0
            ? (invoiceReport.summary.paidCount /
                invoiceReport.summary.totalCount) *
              100
            : 0,
        collectionEfficiency:
          invoiceReport.summary.totalAmount > 0
            ? (invoiceReport.summary.paidAmount /
                invoiceReport.summary.totalAmount) *
              100
            : 0,
        reconciliationAccuracy:
          reconciliationReport.summary.totalCount > 0
            ? (reconciliationReport.summary.matchedCount /
                reconciliationReport.summary.totalCount) *
              100
            : 0,
      },
    };

    // 缓存结果，TTL为5分钟
    this.cache.set(cacheKey, result, 300);

    return result;
  }

  /**
   * 获取合同趋势数据
   */
  private async getContractTrend(
    params: ReportQueryParams
  ): Promise<ReportDataItem[]> {
    const { startDate, endDate, groupBy = 'month', kitId } = params;

    const query = this.contractRepository.createQueryBuilder('contract');

    if (kitId) {
      query.andWhere('contract.kit_id = :kitId', { kitId });
    }

    if (startDate) {
      query.andWhere('contract.start_date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('contract.start_date <= :endDate', { endDate });
    }

    // 根据时间维度分组
    const dateFormat = this.getDateFormat(groupBy);
    query
      .select(`DATE_FORMAT(contract.start_date, '${dateFormat}')`, 'period')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(contract.total_amount)', 'amount')
      .groupBy('period')
      .orderBy('period', 'ASC');

    const result = await query.getRawMany();

    return result.map(item => ({
      period: item.period,
      periodLabel: this.formatPeriodLabel(item.period, groupBy),
      count: parseInt(item.count) || 0,
      amount: parseFloat(item.amount) || 0,
    }));
  }

  /**
   * 获取合同状态分布
   */
  private async getContractStatusDistribution(params: ReportQueryParams) {
    const { startDate, endDate, kitId } = params;

    const query = this.contractRepository.createQueryBuilder('contract');

    if (kitId) {
      query.andWhere('contract.kit_id = :kitId', { kitId });
    }

    if (startDate) {
      query.andWhere('contract.start_date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('contract.start_date <= :endDate', { endDate });
    }

    query
      .select('contract.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(contract.total_amount)', 'amount')
      .groupBy('contract.status');

    const result = await query.getRawMany();

    const statusLabels = {
      draft: '草稿',
      active: '执行中',
      completed: '已完成',
      cancelled: '已取消',
    };

    const totalCount = result.reduce(
      (sum, item) => sum + parseInt(item.count),
      0
    );

    return result.map(item => ({
      status: item.status,
      statusLabel: statusLabels[item.status] || item.status,
      count: parseInt(item.count) || 0,
      amount: parseFloat(item.amount) || 0,
      percentage: totalCount > 0 ? (parseInt(item.count) / totalCount) * 100 : 0,
    }));
  }

  /**
   * 获取发票趋势数据
   */
  private async getInvoiceTrend(
    params: ReportQueryParams
  ): Promise<ReportDataItem[]> {
    const { startDate, endDate, groupBy = 'month', kitId } = params;

    const query = this.invoiceRepository.createQueryBuilder('invoice');

    if (kitId) {
      query.andWhere('invoice.kit_id = :kitId', { kitId });
    }

    if (startDate) {
      query.andWhere('invoice.issue_date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('invoice.issue_date <= :endDate', { endDate });
    }

    // 根据时间维度分组
    const dateFormat = this.getDateFormat(groupBy);
    query
      .select(`DATE_FORMAT(invoice.issue_date, '${dateFormat}')`, 'period')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(invoice.total_amount)', 'amount')
      .groupBy('period')
      .orderBy('period', 'ASC');

    const result = await query.getRawMany();

    return result.map(item => ({
      period: item.period,
      periodLabel: this.formatPeriodLabel(item.period, groupBy),
      count: parseInt(item.count) || 0,
      amount: parseFloat(item.amount) || 0,
    }));
  }

  /**
   * 获取发票状态分布
   */
  private async getInvoiceStatusDistribution(params: ReportQueryParams) {
    const { startDate, endDate, kitId } = params;

    const query = this.invoiceRepository.createQueryBuilder('invoice');

    if (kitId) {
      query.andWhere('invoice.kit_id = :kitId', { kitId });
    }

    if (startDate) {
      query.andWhere('invoice.issue_date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('invoice.issue_date <= :endDate', { endDate });
    }

    query
      .select('invoice.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(invoice.total_amount)', 'amount')
      .groupBy('invoice.status');

    const result = await query.getRawMany();

    const statusLabels = {
      draft: '草稿',
      issued: '已开具',
      paid: '已支付',
      overdue: '逾期',
      cancelled: '已取消',
    };

    const totalCount = result.reduce(
      (sum, item) => sum + parseInt(item.count),
      0
    );

    return result.map(item => ({
      status: item.status,
      statusLabel: statusLabels[item.status] || item.status,
      count: parseInt(item.count) || 0,
      amount: parseFloat(item.amount) || 0,
      percentage: totalCount > 0 ? (parseInt(item.count) / totalCount) * 100 : 0,
    }));
  }

  /**
   * 获取支付趋势数据
   */
  private async getPaymentTrend(
    params: ReportQueryParams
  ): Promise<ReportDataItem[]> {
    const { startDate, endDate, groupBy = 'month', kitId } = params;

    const query = this.paymentRepository.createQueryBuilder('payment');

    if (kitId) {
      query.andWhere('payment.kit_id = :kitId', { kitId });
    }

    if (startDate) {
      query.andWhere('payment.payment_date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('payment.payment_date <= :endDate', { endDate });
    }

    // 根据时间维度分组
    const dateFormat = this.getDateFormat(groupBy);
    query
      .select(`DATE_FORMAT(payment.payment_date, '${dateFormat}')`, 'period')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'amount')
      .groupBy('period')
      .orderBy('period', 'ASC');

    const result = await query.getRawMany();

    return result.map(item => ({
      period: item.period,
      periodLabel: this.formatPeriodLabel(item.period, groupBy),
      count: parseInt(item.count) || 0,
      amount: parseFloat(item.amount) || 0,
    }));
  }

  /**
   * 获取支付方式分布
   */
  private async getPaymentMethodDistribution(params: ReportQueryParams) {
    const { startDate, endDate, kitId } = params;

    const query = this.paymentRepository.createQueryBuilder('payment');

    if (kitId) {
      query.andWhere('payment.kit_id = :kitId', { kitId });
    }

    if (startDate) {
      query.andWhere('payment.payment_date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('payment.payment_date <= :endDate', { endDate });
    }

    query
      .select('payment.payment_method', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'amount')
      .groupBy('payment.payment_method');

    const result = await query.getRawMany();

    const methodLabels = {
      bank_transfer: '银行转账',
      cash: '现金',
      check: '支票',
      online_payment: '在线支付',
      other: '其他',
    };

    const totalCount = result.reduce(
      (sum, item) => sum + parseInt(item.count),
      0
    );

    return result.map(item => ({
      method: item.method,
      methodLabel: methodLabels[item.method] || item.method,
      count: parseInt(item.count) || 0,
      amount: parseFloat(item.amount) || 0,
      percentage: totalCount > 0 ? (parseInt(item.count) / totalCount) * 100 : 0,
    }));
  }

  /**
   * 获取对账趋势数据
   */
  private async getReconciliationTrend(
    params: ReportQueryParams
  ): Promise<ReportDataItem[]> {
    const { startDate, endDate, groupBy = 'month', kitId } = params;

    const query =
      this.reconciliationRepository.createQueryBuilder('reconciliation');

    if (kitId) {
      query.andWhere('reconciliation.kit_id = :kitId', { kitId });
    }

    if (startDate) {
      query.andWhere('reconciliation.reconciled_at >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      query.andWhere('reconciliation.reconciled_at <= :endDate', { endDate });
    }

    // 根据时间维度分组
    const dateFormat = this.getDateFormat(groupBy);
    query
      .select(
        `DATE_FORMAT(reconciliation.reconciled_at, '${dateFormat}')`,
        'period'
      )
      .addSelect('COUNT(*)', 'count')
      .groupBy('period')
      .orderBy('period', 'ASC');

    const result = await query.getRawMany();

    return result.map(item => ({
      period: item.period,
      periodLabel: this.formatPeriodLabel(item.period, groupBy),
      count: parseInt(item.count) || 0,
    }));
  }

  /**
   * 获取对账状态分布
   */
  private async getReconciliationStatusDistribution(params: ReportQueryParams) {
    const { startDate, endDate, kitId } = params;

    const query =
      this.reconciliationRepository.createQueryBuilder('reconciliation');

    if (kitId) {
      query.andWhere('reconciliation.kit_id = :kitId', { kitId });
    }

    if (startDate) {
      query.andWhere('reconciliation.reconciled_at >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      query.andWhere('reconciliation.reconciled_at <= :endDate', { endDate });
    }

    query
      .select('reconciliation.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('reconciliation.status');

    const result = await query.getRawMany();

    const statusLabels = {
      matched: '已匹配',
      unmatched: '未匹配',
      underpaid: '少付',
      overpaid: '多付',
      partial: '部分匹配',
    };

    const totalCount = result.reduce(
      (sum, item) => sum + parseInt(item.count),
      0
    );

    return result.map(item => ({
      status: item.status,
      statusLabel: statusLabels[item.status] || item.status,
      count: parseInt(item.count) || 0,
      percentage: totalCount > 0 ? (parseInt(item.count) / totalCount) * 100 : 0,
    }));
  }

  /**
   * 获取日期格式化字符串
   */
  private getDateFormat(groupBy: string): string {
    switch (groupBy) {
      case 'day':
        return '%Y-%m-%d';
      case 'month':
        return '%Y-%m';
      case 'quarter':
        return '%Y-Q%q';
      case 'year':
        return '%Y';
      default:
        return '%Y-%m';
    }
  }

  /**
   * 格式化周期标签
   */
  private formatPeriodLabel(period: string, groupBy: string): string {
    if (!period) return '';

    switch (groupBy) {
      case 'day':
        return period;
      case 'month':
        return period;
      case 'quarter':
        return period;
      case 'year':
        return period + '年';
      default:
        return period;
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}
