import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { subscriptionApi } from '@/api/subscription'
import { 
  Subscription, 
  SubscriptionType, 
  PaginationQuery, 
  PaginationResult,
  SubscriptionRenewalRecord,
  SubscriptionRenewalAttachment
} from '@/api/types'

export const useSubscriptionStore = defineStore('subscription', () => {
  const subscriptions = ref<Subscription[]>([])
  const subscriptionTypes = ref<SubscriptionType[]>([])
  const currentSubscription = ref<Subscription | null>(null)
  const renewalLogs = ref<SubscriptionRenewalRecord[]>([])
  const loading = ref(false)

  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0
  })

  const fetchSubscriptions = async (params: PaginationQuery & { search?: string, status?: string, typeId?: number } = {}) => {
    loading.value = true
    try {
      const response = await subscriptionApi.getSubscriptions({
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...params
      })
      if (response.success && response.data) {
        subscriptions.value = response.data.items
        pagination.value.total = response.data.total
      }
    } finally {
      loading.value = false
    }
  }

  const fetchSubscription = async (id: number) => {
    loading.value = true
    try {
      const response = await subscriptionApi.getSubscription(id)
      if (response.success && response.data) {
        currentSubscription.value = response.data
      }
    } finally {
      loading.value = false
    }
  }

  const createSubscription = async (data: Omit<Subscription, 'id'>) => {
    const response = await subscriptionApi.createSubscription(data)
    if (response.success && response.data) {
      subscriptions.value.unshift(response.data)
    }
    return response
  }

  const updateSubscription = async (id: number, data: Partial<Subscription>) => {
    const response = await subscriptionApi.updateSubscription(id, data)
    if (response.success && response.data) {
      const index = subscriptions.value.findIndex(s => s.id === id)
      if (index !== -1) {
        subscriptions.value[index] = response.data
      }
      if (currentSubscription.value?.id === id) {
        currentSubscription.value = response.data
      }
    }
    return response
  }

  const disableSubscription = async (id: number) => {
    const response = await subscriptionApi.disableSubscription(id)
    if (response.success) {
      const subscription = subscriptions.value.find(s => s.id === id)
      if (subscription) {
        subscription.status = 'inactive'
      }
      if (currentSubscription.value?.id === id) {
        currentSubscription.value.status = 'inactive'
      }
    }
    return response
  }

  const enableSubscription = async (id: number) => {
    const response = await subscriptionApi.enableSubscription(id)
    if (response.success) {
      const subscription = subscriptions.value.find(s => s.id === id)
      if (subscription) {
        subscription.status = 'active'
      }
      if (currentSubscription.value?.id === id) {
        currentSubscription.value.status = 'active'
      }
    }
    return response
  }

  const fetchRenewalLogs = async (id: number) => {
    loading.value = true
    try {
      const response = await subscriptionApi.getRenewalLogs(id)
      if (response.success && response.data) {
        renewalLogs.value = response.data
      }
    } finally {
      loading.value = false
    }
  }

  const deleteRenewalLog = async (id: number, renewalLogId: number) => {
    const response = await subscriptionApi.deleteRenewalLog(id, renewalLogId)
    if (response.success) {
      renewalLogs.value = renewalLogs.value.filter(log => log.id !== renewalLogId)
    }
    return response
  }

  const deleteRenewalAttachment = async (attachmentId: number) => {
    const response = await subscriptionApi.deleteRenewalAttachment(attachmentId)
    return response
  }

  const fetchSubscriptionTypes = async () => {
    const response = await subscriptionApi.getSubscriptionTypes()
    subscriptionTypes.value = response.success && response.data ? response.data : []
    return response
  }

  return {
    subscriptions,
    subscriptionTypes,
    currentSubscription,
    renewalLogs,
    loading,
    pagination,
    fetchSubscriptions,
    fetchSubscription,
    createSubscription,
    updateSubscription,
    disableSubscription,
    enableSubscription,
    fetchRenewalLogs,
    deleteRenewalLog,
    deleteRenewalAttachment,
    fetchSubscriptionTypes
  }
})