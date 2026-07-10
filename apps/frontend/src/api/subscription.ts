import { apiClient } from './config'
import { 
  ApiResponse, 
  Subscription, 
  SubscriptionType, 
  PaginationQuery, 
  PaginationResult,
  SubscriptionRenewalLog,
  SubscriptionRenewalAttachment,
  SubscriptionRenewalRecord
} from './types'

export const subscriptionApi = {
  getSubscriptions(params: PaginationQuery & { 
    search?: string, 
    status?: string,
    typeId?: number
  }): Promise<ApiResponse<PaginationResult<Subscription>>> {
    return apiClient.get('/subscriptions', { params }).then(res => res.data)
  },

  getSubscription(id: number): Promise<ApiResponse<Subscription>> {
    return apiClient.get(`/subscriptions/${id}`).then(res => res.data)
  },

  createSubscription(data: Omit<Subscription, 'id'>): Promise<ApiResponse<Subscription>> {
    return apiClient.post('/subscriptions', data).then(res => res.data)
  },

  updateSubscription(id: number, data: Partial<Subscription>): Promise<ApiResponse<Subscription>> {
    return apiClient.put(`/subscriptions/${id}`, data).then(res => res.data)
  },

  disableSubscription(id: number): Promise<ApiResponse> {
    return apiClient.put(`/subscriptions/${id}/disable`).then(res => res.data)
  },

  enableSubscription(id: number): Promise<ApiResponse> {
    return apiClient.put(`/subscriptions/${id}/enable`).then(res => res.data)
  },

  getRenewalRecords(id: number): Promise<ApiResponse<SubscriptionRenewalRecord[]>> {
    return apiClient.get(`/subscriptions/${id}/renewal-records`).then(res => res.data)
  },

  getRenewalRecord(recordId: number): Promise<ApiResponse<SubscriptionRenewalRecord>> {
    return apiClient.get(`/subscriptions/renewal-records/${recordId}`).then(res => res.data)
  },

  createRenewalRecord(id: number, data: any): Promise<ApiResponse<SubscriptionRenewalRecord>> {
    return apiClient.post(`/subscriptions/${id}/renewal-records`, data).then(res => res.data)
  },

  updateRenewalRecord(recordId: number, data: any): Promise<ApiResponse<SubscriptionRenewalRecord>> {
    return apiClient.put(`/subscriptions/renewal-records/${recordId}`, data).then(res => res.data)
  },

  deleteRenewalRecord(recordId: number): Promise<ApiResponse> {
    return apiClient.delete(`/subscriptions/renewal-records/${recordId}`).then(res => res.data)
  },

  getRenewalLogs(id: number): Promise<ApiResponse<SubscriptionRenewalRecord[]>> {
    return apiClient.get(`/subscriptions/${id}/renewal-records`).then(res => res.data)
  },

  deleteRenewalLog(id: number, renewalLogId: number): Promise<ApiResponse> {
    return apiClient.delete(`/subscriptions/${id}/renewal-logs/${renewalLogId}`).then(res => res.data)
  },

  renewSubscription(id: number, data: any): Promise<ApiResponse<Subscription>> {
    return apiClient.post(`/subscriptions/${id}/renew`, data).then(res => res.data)
  },

  getRenewalRecordAttachments(recordId: number): Promise<ApiResponse<SubscriptionRenewalAttachment[]>> {
    return apiClient.get(`/subscriptions/renewal-records/${recordId}/attachments`).then(res => res.data)
  },

  uploadAttachment(recordId: number, attachmentType: 'contract' | 'invoice', formData: FormData): Promise<ApiResponse<SubscriptionRenewalAttachment>> {
    return apiClient.post(`/subscriptions/renewal-records/${recordId}/attachments`, formData, {
      params: { attachment_type: attachmentType }
    }).then(res => res.data)
  },

  previewAttachment(attachmentId: number): Promise<any> {
    return apiClient.get(`/subscriptions/attachments/${attachmentId}/preview`).then(res => res.data)
  },

  publicPreviewAttachment(attachmentId: number): Promise<any> {
    return apiClient.get(`/subscriptions/attachments/public-preview/${attachmentId}`).then(res => res.data)
  },

  deleteRenewalAttachment(attachmentId: number): Promise<ApiResponse> {
    return apiClient.delete(`/subscriptions/attachments/${attachmentId}`).then(res => res.data)
  }
}