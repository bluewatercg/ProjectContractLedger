import apiClient from './config'
import type {
  ApiResponse,
  PaginationQuery,
  PaginationResult,
  Contract,
  CreateContractDto,
  UpdateContractDto,
  ContractInvoicePlan,
  ConfirmNonRenewalDto
} from './types'

export const contractApi = {
  /**
   * 获取合同列表
   */
  getContracts(params: PaginationQuery & { customerId?: number; status?: string; billingStatus?: string; search?: string; viewAll?: boolean }): Promise<ApiResponse<PaginationResult<Contract>>> {
    return apiClient.get('/contracts', { params }).then(res => res.data)
  },

  /**
   * 根据ID获取合同详情
   */
  getContractById(
    id: number,
    params?: { viewAll?: boolean }
  ): Promise<ApiResponse<Contract>> {
    return apiClient.get(`/contracts/${id}`, { params }).then(res => res.data)
  },

  /**
   * 获取可关联旧合同列表
   */
  getPreviousContractOptions(params: {
    customerId: number
    currentContractId?: number
    viewAll?: boolean
  }): Promise<ApiResponse<Contract[]>> {
    return apiClient.get('/contracts/previous-options', { params }).then(res => res.data)
  },

  /**
   * 获取合同下的开票计划列表
   */
  getContractInvoicePlans(
    contractId: number,
    params?: { viewAll?: boolean }
  ): Promise<ApiResponse<ContractInvoicePlan[]>> {
    return apiClient.get(`/contracts/${contractId}/invoice-plans`, { params }).then(res => res.data)
  },

  /**
   * 批量保存合同下的开票计划
   */
  saveContractInvoicePlans(
    contractId: number,
    plans: Array<{
      id?: number
      phase_name: string
      pay_ratio?: number
      planned_amount: number
      planned_invoice_date?: string
      remind_days_before?: number
    }>,
    params?: { viewAll?: boolean }
  ): Promise<ApiResponse<ContractInvoicePlan[]>> {
    return apiClient.post(`/contracts/${contractId}/invoice-plans`, { plans }, { params }).then(res => res.data)
  },

  /**
   * 删除单条开票计划
   */
  deleteContractInvoicePlan(
    contractId: number,
    planId: number,
    params?: { viewAll?: boolean }
  ): Promise<ApiResponse<void>> {
    return apiClient.delete(`/contracts/${contractId}/invoice-plans/${planId}`, { params }).then(res => res.data)
  },

  /**
   * 创建合同
   */
  createContract(data: CreateContractDto): Promise<ApiResponse<Contract>> {
    return apiClient.post('/contracts', data).then(res => res.data)
  },

  /**
   * 更新合同信息
   */
  updateContract(
    id: number,
    data: UpdateContractDto,
    params?: { viewAll?: boolean }
  ): Promise<ApiResponse<Contract>> {
    return apiClient.put(`/contracts/${id}`, data, { params }).then(res => res.data)
  },

  /**
   * 删除合同
   */
  deleteContract(
    id: number,
    params?: { viewAll?: boolean }
  ): Promise<ApiResponse<void>> {
    return apiClient.delete(`/contracts/${id}`, { params }).then(res => res.data)
  },

  /**
   * 获取合同统计信息
   */
  getContractStats(): Promise<ApiResponse<any>> {
    return apiClient.get('/contracts/stats/overview').then(res => res.data)
  },

  /**
   * 确认不续签
   */
  confirmNonRenewal(
    id: number,
    data: ConfirmNonRenewalDto
  ): Promise<ApiResponse<Contract>> {
    return apiClient.post(`/contracts/${id}/non-renew`, data).then(res => res.data)
  },

  /**
   * 确认续签
   */
  confirmRenewal(
    id: number
  ): Promise<ApiResponse<Contract>> {
    return apiClient.post(`/contracts/${id}/renew`).then(res => res.data)
  },

  /**
   * 批量设置业务分类
   */
  batchSetCategory(
    ids: number[],
    category_id: number | null
  ): Promise<ApiResponse<{ updated: number }>> {
    return apiClient.patch('/contracts/batch-category', { ids, category_id }).then(res => res.data)
  }
}
