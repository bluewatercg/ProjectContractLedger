import apiClient from './config'
import type { ApiResponse } from './types'

export interface MarkBadDebtData {
  invoice_id: number
  bad_debt_amount: number
  bad_debt_reason?: string
}

export interface BadDebtInfo {
  invoice_id: number
  invoice_number: string
  bad_debt_amount: number
  bad_debt_reason: string | null
  bad_debt_handler: number | null
  bad_debt_marked_at: string | null
  status: string
}

export interface BadDebtStats {
  totalCount: number
  totalAmount: number
  byContract: Array<{ contractId: number; badDebtAmount: number; count: number }>
  byMonth: Array<{ month: string; amount: number; count: number }>
}

export const badDebtApi = {
  /**
   * 标记发票为坏账
   */
  markAsBadDebt(data: MarkBadDebtData): Promise<ApiResponse> {
    return apiClient.post('/bad-debt', data).then(res => res.data)
  },

  /**
   * 撤销坏账
   */
  undoBadDebt(invoiceId: number): Promise<ApiResponse> {
    return apiClient.post(`/bad-debt/${invoiceId}/undo`).then(res => res.data)
  },

  /**
   * 查询发票坏账信息
   */
  getBadDebtInfo(invoiceId: number): Promise<ApiResponse<BadDebtInfo | null>> {
    return apiClient.get(`/bad-debt/${invoiceId}`).then(res => res.data)
  },

  /**
   * 获取坏账统计
   */
  getBadDebtStats(params?: { year?: number }): Promise<ApiResponse<BadDebtStats>> {
    return apiClient.get('/bad-debt/stats', { params }).then(res => res.data)
  }
}
