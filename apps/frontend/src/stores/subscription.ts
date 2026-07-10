import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { subscriptionApi } from '@/api/subscription'
import type {
  SubscriptionRecord,
  SubscriptionType,
  SubscriptionRenewalLog,
  SubscriptionQuery,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  RenewSubscriptionDto
} from '@/api/types'

export const useSubscriptionStore = defineStore('subscription', () => {
  const subscriptions = ref<SubscriptionRecord[]>([])
  const types = ref<SubscriptionType[]>([])
  const currentSubscription = ref<SubscriptionRecord | null>(null)
  const renewalLogs = ref<SubscriptionRenewalLog[]>([])
  const loading = ref(false)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)

  const expiringCount = computed(() => subscriptions.value.filter(item => item.expiryStatus === 'expiring').length)
  const overdueCount = computed(() => subscriptions.value.filter(item => item.expiryStatus === 'overdue').length)

  const fetchTypes = async () => {
    const res = await subscriptionApi.getTypes('active')
    types.value = res.data || []
    return types.value
  }

  const fetchSubscriptions = async (query: SubscriptionQuery = {}) => {
    loading.value = true
    try {
      const res = await subscriptionApi.getSubscriptions({ page: page.value, limit: limit.value, ...query })
      const data = res.data
      subscriptions.value = data?.items || []
      total.value = data?.total || 0
      page.value = data?.page || page.value
      limit.value = data?.limit || limit.value
      return data
    } finally {
      loading.value = false
    }
  }

  const fetchSubscription = async (id: number) => {
    loading.value = true
    try {
      const res = await subscriptionApi.getSubscriptionById(id)
      currentSubscription.value = res.data || null
      return currentSubscription.value
    } finally {
      loading.value = false
    }
  }

  const createSubscription = async (data: CreateSubscriptionDto) => {
    const res = await subscriptionApi.createSubscription(data)
    if (res.data) {
      subscriptions.value.unshift(res.data)
    }
    return res.data
  }

  const updateSubscription = async (id: number, data: UpdateSubscriptionDto) => {
    const res = await subscriptionApi.updateSubscription(id, data)
    if (res.data) {
      const index = subscriptions.value.findIndex(item => item.id === id)
      if (index >= 0) subscriptions.value[index] = res.data
      currentSubscription.value = res.data
    }
    return res.data
  }

  const disableSubscription = async (id: number) => {
    const res = await subscriptionApi.disableSubscription(id)
    if (res.data) {
      const index = subscriptions.value.findIndex(item => item.id === id)
      if (index >= 0) subscriptions.value[index] = res.data
      currentSubscription.value = res.data
    }
    return res.data
  }

  const enableSubscription = async (id: number) => {
    const res = await subscriptionApi.enableSubscription(id)
    if (res.data) {
      const index = subscriptions.value.findIndex(item => item.id === id)
      if (index >= 0) subscriptions.value[index] = res.data
      currentSubscription.value = res.data
    }
    return res.data
  }

  const renewSubscription = async (id: number, data: RenewSubscriptionDto) => {
    const res = await subscriptionApi.renewSubscription(id, data)
    if (res.data) {
      const index = subscriptions.value.findIndex(item => item.id === id)
      if (index >= 0) subscriptions.value[index] = res.data
      currentSubscription.value = res.data
    }
    return res.data
  }

  const uploadRenewalAttachment = async (renewalLogId: number, attachmentType: 'contract' | 'invoice', file: File) => {
    const res = await subscriptionApi.uploadRenewalAttachment(renewalLogId, attachmentType, file)
    return res.data
  }

  const deleteRenewalAttachment = async (attachmentId: number) => {
    const res = await subscriptionApi.deleteRenewalAttachment(attachmentId)
    return res
  }

  const deleteRenewalLog = async (id: number, renewalLogId: number) => {
    const res = await subscriptionApi.deleteRenewalLog(id, renewalLogId)
    return res
  }

  const fetchRenewalLogs = async (id: number) => {
    const res = await subscriptionApi.getRenewalLogs(id)
    renewalLogs.value = res.data || []
    return renewalLogs.value
  }

  return {
    subscriptions,
    types,
    currentSubscription,
    renewalLogs,
    loading,
    total,
    page,
    limit,
    expiringCount,
    overdueCount,
    fetchTypes,
    fetchSubscriptions,
    fetchSubscription,
    createSubscription,
    updateSubscription,
    disableSubscription,
    enableSubscription,
    renewSubscription,
    uploadRenewalAttachment,
    deleteRenewalAttachment,
    deleteRenewalLog,
    fetchRenewalLogs
  }
})
