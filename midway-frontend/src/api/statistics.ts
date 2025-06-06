import apiClient from './config'
import type { ApiResponse, DashboardStats } from './types'

export const statisticsApi = {
  /**
   * 获取仪表板统计数据
   */
  getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get('/statistics/dashboard').then(res => res.data)
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
  }
}
