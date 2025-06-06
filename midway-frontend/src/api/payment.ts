import apiClient from './config'
import type { 
  ApiResponse, 
  PaginationQuery, 
  PaginationResult, 
  Payment, 
  CreatePaymentDto, 
  UpdatePaymentDto 
} from './types'

export const paymentApi = {
  /**
   * 获取支付记录列表
   */
  getPayments(params: PaginationQuery & { invoiceId?: number; status?: string }): Promise<ApiResponse<PaginationResult<Payment>>> {
    return apiClient.get('/payments', { params }).then(res => res.data)
  },

  /**
   * 根据ID获取支付记录详情
   */
  getPaymentById(id: number): Promise<ApiResponse<Payment>> {
    return apiClient.get(`/payments/${id}`).then(res => res.data)
  },

  /**
   * 创建支付记录
   */
  createPayment(data: CreatePaymentDto): Promise<ApiResponse<Payment>> {
    return apiClient.post('/payments', data).then(res => res.data)
  },

  /**
   * 更新支付记录信息
   */
  updatePayment(id: number, data: UpdatePaymentDto): Promise<ApiResponse<Payment>> {
    return apiClient.put(`/payments/${id}`, data).then(res => res.data)
  },

  /**
   * 删除支付记录
   */
  deletePayment(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/payments/${id}`).then(res => res.data)
  },

  /**
   * 根据发票ID获取支付记录
   */
  getPaymentsByInvoiceId(invoiceId: number): Promise<ApiResponse<Payment[]>> {
    return apiClient.get(`/payments/invoice/${invoiceId}`).then(res => res.data)
  },

  /**
   * 获取支付统计信息
   */
  getPaymentStats(): Promise<ApiResponse<any>> {
    return apiClient.get('/payments/stats/overview').then(res => res.data)
  }
}
