import apiClient from './config'
import type {
  ApiResponse,
  PaginationQuery,
  PaginationResult,
  Reconciliation,
  ReconciliationStats,
  PendingInvoice,
  ManualReconcileDto,
  HandleDifferenceDto,
  ApproveReconciliationDto,
} from './types'

export const reconciliationApi = {
  /**
   * 自动对账（单个发票）
   */
  autoReconcile(invoiceId: number): Promise<ApiResponse<Reconciliation>> {
    return apiClient
      .post(`/reconciliations/auto/${invoiceId}`)
      .then(res => res.data)
  },

  /**
   * 批量自动对账
   */
  batchAutoReconcile(invoiceIds: number[]): Promise<ApiResponse<Reconciliation[]>> {
    return apiClient
      .post('/reconciliations/batch-auto', { invoiceIds })
      .then(res => res.data)
  },

  /**
   * 手动对账
   */
  manualReconcile(data: ManualReconcileDto): Promise<ApiResponse<Reconciliation>> {
    return apiClient
      .post('/reconciliations/manual', data)
      .then(res => res.data)
  },

  /**
   * 获取对账记录列表
   */
  getReconciliations(
    params?: PaginationQuery & {
      status?: string
      approvalStatus?: string
      invoiceId?: number
      startDate?: string
      endDate?: string
    }
  ): Promise<ApiResponse<PaginationResult<Reconciliation>>> {
    return apiClient
      .get('/reconciliations', { params })
      .then(res => res.data)
  },

  /**
   * 获取对账记录详情
   */
  getReconciliationById(id: number): Promise<ApiResponse<Reconciliation>> {
    return apiClient
      .get(`/reconciliations/${id}`)
      .then(res => res.data)
  },

  /**
   * 处理差异
   */
  handleDifference(
    id: number,
    data: HandleDifferenceDto
  ): Promise<ApiResponse<Reconciliation>> {
    return apiClient
      .put(`/reconciliations/${id}/handle-difference`, data)
      .then(res => res.data)
  },

  /**
   * 审批对账记录
   */
  approveReconciliation(
    id: number,
    data: ApproveReconciliationDto
  ): Promise<ApiResponse<Reconciliation>> {
    return apiClient
      .put(`/reconciliations/${id}/approve`, data)
      .then(res => res.data)
  },

  /**
   * 获取对账统计
   */
  getStats(): Promise<ApiResponse<ReconciliationStats>> {
    return apiClient
      .get('/reconciliations/stats/summary')
      .then(res => res.data)
  },

  /**
   * 获取待对账发票列表
   */
  getPendingInvoices(): Promise<ApiResponse<PendingInvoice[]>> {
    return apiClient
      .get('/reconciliations/pending-invoices')
      .then(res => res.data)
  },
}
