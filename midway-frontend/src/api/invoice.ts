import apiClient from './config'
import type { 
  ApiResponse, 
  PaginationQuery, 
  PaginationResult, 
  Invoice, 
  CreateInvoiceDto, 
  UpdateInvoiceDto 
} from './types'

export const invoiceApi = {
  /**
   * 获取发票列表
   */
  getInvoices(params: PaginationQuery & { contractId?: number; status?: string }): Promise<ApiResponse<PaginationResult<Invoice>>> {
    return apiClient.get('/invoices', { params }).then(res => res.data)
  },

  /**
   * 根据ID获取发票详情
   */
  getInvoiceById(id: number): Promise<ApiResponse<Invoice>> {
    return apiClient.get(`/invoices/${id}`).then(res => res.data)
  },

  /**
   * 创建发票
   */
  createInvoice(data: CreateInvoiceDto): Promise<ApiResponse<Invoice>> {
    return apiClient.post('/invoices', data).then(res => res.data)
  },

  /**
   * 更新发票信息
   */
  updateInvoice(id: number, data: UpdateInvoiceDto): Promise<ApiResponse<Invoice>> {
    return apiClient.put(`/invoices/${id}`, data).then(res => res.data)
  },

  /**
   * 删除发票
   */
  deleteInvoice(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/invoices/${id}`).then(res => res.data)
  },

  /**
   * 获取发票统计信息
   */
  getInvoiceStats(): Promise<ApiResponse<any>> {
    return apiClient.get('/invoices/stats/overview').then(res => res.data)
  },

  /**
   * 获取逾期发票
   */
  getOverdueInvoices(): Promise<ApiResponse<Invoice[]>> {
    return apiClient.get('/invoices/overdue/list').then(res => res.data)
  }
}
