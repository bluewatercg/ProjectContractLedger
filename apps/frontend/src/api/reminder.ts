import { apiClient } from './index'

export interface ReminderItem {
  id: number
  type: 'contract_renewal' | 'contract_fulfillment' | 'invoice_needed' | 'payment_collection'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  targetId: number
  targetType: 'contract' | 'invoice'
  daysUntilDue?: number
  amount?: number
  customerName?: string
  contractNumber?: string
  invoiceNumber?: string
  dueDate?: Date
  actionUrl?: string
  // 业务分类：履约类（合同生命周期）| 开票类（财务开票流程）| 收款类（财务收款流程）
  category: 'fulfillment' | 'invoice' | 'payment'
}

export interface ReminderSummary {
  total: number
  high: number
  medium: number
  low: number
  items: ReminderItem[]
}

export interface ReminderCountResponse {
  count: number
  type: string
}

export const reminderApi = {
  /**
   * 获取所有提醒事项
   */
  getAllReminders: () => {
    return apiClient.get<ReminderSummary>('/reminders').then(res => res.data)
  },

  /**
   * 获取提醒数量统计
   */
  getReminderCount: (type?: string) => {
    const params = type ? { type } : {}
    return apiClient.get<ReminderCountResponse>('/reminders/count', { params }).then(res => res.data)
  },

  /**
   * 标记提醒为已处理
   */
  markAsHandled: (id: number, type: string) => {
    return apiClient.post(`/reminders/${id}/handled`, null, { 
      params: { type } 
    }).then(res => res.data)
  },

  /**
   * 获取合同履约提醒（履约类）
   */
  getContractFulfillment: () => {
    return apiClient.get<{ total: number; items: ReminderItem[] }>('/reminders/contract-fulfillment').then(res => res.data)
  },

  /**
   * 获取开票提醒（开票类）- 完全独立的业务维度
   */
  getInvoiceNeeded: () => {
    return apiClient.get<{ total: number; items: ReminderItem[] }>('/reminders/invoice-needed').then(res => res.data)
  },

  /**
   * 获取收款提醒（收款类）- 完全独立的业务维度
   */
  getPaymentNeeded: () => {
    return apiClient.get<{ total: number; items: ReminderItem[] }>('/reminders/payment-needed').then(res => res.data)
  },

  /**
   * 获取收款催办提醒（财务收款专用）
   */
  getPaymentCollection: () => {
    return apiClient.get<{ total: number; items: ReminderItem[] }>('/reminders/payment-collection').then(res => res.data)
  },

  /**
   * 获取合同续签提醒（兼容旧API）
   */
  getContractRenewals: () => {
    return apiClient.get<{ total: number; items: ReminderItem[] }>('/reminders/contract-renewals').then(res => res.data)
  }
}