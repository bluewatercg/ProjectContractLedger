import apiClient from './config'
import type {
  ApiResponse,
  PaginationQuery,
  PaginationResult,
  Contract,
  CreateContractDto,
  UpdateContractDto,
  ContractInvoicePlan,
  ConfirmNonRenewalDto,
  PlanAllocationDetail,
  PlanSideAllocationItem,
  AllocatableInvoice
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
   * 获取某期开票计划已分摊的发票明细
   */
  getPlanAllocations(
    contractId: number,
    planId: number,
    params?: { viewAll?: boolean }
  ): Promise<ApiResponse<PlanAllocationDetail[]>> {
    return apiClient
      .get(`/contracts/${contractId}/invoice-plans/${planId}/allocations`, { params })
      .then(res => res.data)
  },

  /**
   * 覆盖式保存某期计划的发票分摊
   */
  savePlanAllocations(
    contractId: number,
    planId: number,
    items: PlanSideAllocationItem[]
  ): Promise<ApiResponse<PlanAllocationDetail[]>> {
    return apiClient
      .put(`/contracts/${contractId}/invoice-plans/${planId}/allocations`, { items })
      .then(res => res.data)
  },

  /**
   * 解除某期计划与某张发票的关联
   */
  removePlanAllocation(
    contractId: number,
    planId: number,
    invoiceId: number
  ): Promise<ApiResponse<void>> {
    return apiClient
      .delete(`/contracts/${contractId}/invoice-plans/${planId}/allocations/${invoiceId}`)
      .then(res => res.data)
  },

  /**
   * 获取本合同下可分摊的发票及剩余额度
   */
  getAllocatableInvoices(
    contractId: number,
    planId: number,
    params?: { viewAll?: boolean }
  ): Promise<ApiResponse<AllocatableInvoice[]>> {
    return apiClient
      .get(`/contracts/${contractId}/invoice-plans/${planId}/allocatable-invoices`, { params })
      .then(res => res.data)
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
