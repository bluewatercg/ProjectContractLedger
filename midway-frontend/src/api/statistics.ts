import apiClient from './config'
import type { ApiResponse, DashboardStats } from './types'
import { cache } from '@/utils/cache'

export const statisticsApi = {
  /**
   * 获取仪表板统计数据（带缓存）
   */
  async getDashboardStats(useCache: boolean = true): Promise<ApiResponse<DashboardStats>> {
    const cacheKey = 'dashboard_stats';

    // 尝试从缓存获取
    if (useCache) {
      const cachedData = cache.get(cacheKey, true);
      if (cachedData) {
        console.log('Dashboard stats loaded from cache');
        return cachedData;
      }
    }

    console.log('Fetching fresh dashboard stats from API');
    const startTime = Date.now();

    try {
      const response = await apiClient.get('/statistics/dashboard');
      const result = response.data;

      const endTime = Date.now();
      console.log(`Dashboard stats API call took ${endTime - startTime}ms`);

      // 缓存结果，TTL为3分钟，持久化
      if (result.success) {
        cache.set(cacheKey, result, 180, true);
      }

      return result;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  },

  /**
   * 获取月度收入趋势
   */
  getMonthlyRevenueTrend(months?: number): Promise<ApiResponse<any[]>> {
    return apiClient.get('/statistics/revenue/trend', { 
      params: { months } 
    }).then(res => res.data)
  },

  /**
   * 获取客户分布统计
   */
  getCustomerDistribution(): Promise<ApiResponse<any>> {
    return apiClient.get('/statistics/customers/distribution').then(res => res.data)
  },

  /**
   * 获取合同状态分布
   */
  getContractStatusDistribution(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/statistics/contracts/status').then(res => res.data)
  },

  /**
   * 获取发票状态分布
   */
  getInvoiceStatusDistribution(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/statistics/invoices/status').then(res => res.data)
  },

  /**
   * 获取支付方式统计
   */
  getPaymentMethodStats(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/statistics/payments/methods').then(res => res.data)
  },

  /**
   * 获取逾期发票提醒
   */
  getOverdueInvoicesAlert(): Promise<ApiResponse<any>> {
    return apiClient.get('/statistics/alerts/overdue').then(res => res.data)
  },

  /**
   * 清除统计数据缓存
   */
  clearCache(): void {
    cache.delete('dashboard_stats');
    console.log('Statistics cache cleared');
  },

  /**
   * 强制刷新仪表板数据
   */
  async refreshDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    this.clearCache();
    return this.getDashboardStats(false);
  }
}
