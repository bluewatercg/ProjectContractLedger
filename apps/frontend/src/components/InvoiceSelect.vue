<template>
  <el-select
    v-model="selectedValue"
    :placeholder="placeholder"
    :style="{ width: width }"
    filterable
    remote
    reserve-keyword
    :remote-method="handleSearch"
    :loading="loading"
    clearable
    @change="handleChange"
    @visible-change="handleVisibleChange"
  >
    <el-option
      v-for="invoice in invoices"
      :key="invoice.id"
      :label="`${formatDate(invoice.issue_date)} | ¥${formatCurrency(invoice.amount)}`"
      :value="invoice.id"
    >
      <div class="invoice-option">
        <div class="invoice-number">{{ formatDate(invoice.issue_date) }} | ¥{{ formatCurrency(invoice.amount) }}</div>
        <div class="invoice-info">{{ invoice.invoice_number }}</div>
      </div>
    </el-option>
    
    <!-- 加载更多指示器 -->
    <el-option
      v-if="hasMore && invoices.length > 0"
      :value="'loading'"
      disabled
      style="text-align: center; color: #999;"
    >
      <div @click.stop="loadMore" style="cursor: pointer; padding: 8px;">
        <el-icon v-if="loadingMore"><Loading /></el-icon>
        <span v-else>点击加载更多...</span>
      </div>
    </el-option>
    
    <!-- 无数据提示 -->
    <el-option
      v-if="!loading && invoices.length === 0 && searchKeyword"
      :value="'no-data'"
      disabled
      style="text-align: center; color: #999;"
    >
      未找到相关发票
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import { invoiceApi } from '@/api'
import type { Invoice } from '@/api/types'

// Props
interface Props {
  modelValue?: number | null
  placeholder?: string
  width?: string
  disabled?: boolean
  contractId?: number // 可选的合同ID筛选
  customerId?: number // 可选的客户ID筛选
  status?: string // 可选的状态筛选
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择发票',
  width: '100%',
  disabled: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [value: number | null, invoice: Invoice | null]
}>()

// 状态
const selectedValue = ref<number | null>(props.modelValue || null)
const invoices = ref<Invoice[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const hasMore = ref(true)
const pageSize = 10

// 防抖定时器
let searchTimer: number | null = null

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount)
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap = {
    draft: '草稿',
    sent: '已开票',
    paid: '已支付',
    overdue: '逾期',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

// 监听外部值变化
watch(() => props.modelValue, async (newValue) => {
  selectedValue.value = newValue || null
  // 如果有新值且当前发票列表中没有该发票，则加载该发票信息
  if (newValue && !invoices.value.find(i => i.id === newValue)) {
    await loadInvoiceById(newValue)
  }
})

// 监听内部值变化
watch(selectedValue, (newValue) => {
  emit('update:modelValue', newValue)
})

// 根据ID加载单个发票信息
const loadInvoiceById = async (invoiceId: number) => {
  try {
    const response = await invoiceApi.getInvoiceById(invoiceId)
    if (response.success && response.data) {
      // 检查发票是否已存在于列表中
      const existingIndex = invoices.value.findIndex(i => i.id === invoiceId)
      if (existingIndex === -1) {
        // 将发票添加到列表开头
        invoices.value.unshift(response.data)
      } else {
        // 更新现有发票信息
        invoices.value[existingIndex] = response.data
      }
    }
  } catch (error) {
    console.error('Failed to load invoice by id:', error)
  }
}

// 搜索发票
const searchInvoices = async (keyword: string = '', page: number = 1, append: boolean = false) => {
  try {
    if (page === 1) {
      loading.value = true
    } else {
      loadingMore.value = true
    }

    const params: any = {
      page,
      limit: pageSize,
      search: keyword.trim(),
      sortBy: 'created_at',
      sortOrder: 'DESC'
    }

    // 如果指定了合同ID，添加筛选条件
    if (props.contractId) {
      params.contractId = props.contractId
    }

    // 如果指定了客户ID，添加筛选条件
    if (props.customerId) {
      params.customerId = props.customerId
    }

    // 如果指定了状态，添加筛选条件
    if (props.status) {
      params.status = props.status
    }

    const response = await invoiceApi.getInvoices(params)

    if (response.success && response.data) {
      const newInvoices = response.data.items
      
      if (append) {
        invoices.value = [...invoices.value, ...newInvoices]
      } else {
        invoices.value = newInvoices
      }
      
      currentPage.value = page
      hasMore.value = page < response.data.totalPages
    }
  } catch (error) {
    console.error('Failed to search invoices:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 处理搜索输入（带防抖）
const handleSearch = (keyword: string) => {
  searchKeyword.value = keyword
  
  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  // 设置新的防抖定时器
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    hasMore.value = true
    searchInvoices(keyword, 1, false)
  }, 300) // 300ms 防抖
}

// 加载更多
const loadMore = async () => {
  if (hasMore.value && !loadingMore.value) {
    await searchInvoices(searchKeyword.value, currentPage.value + 1, true)
  }
}

// 处理选择变化
const handleChange = (value: number | null) => {
  const invoice = invoices.value.find(i => i.id === value) || null
  emit('change', value, invoice)
}

// 处理下拉框显示/隐藏
const handleVisibleChange = async (visible: boolean) => {
  if (visible && invoices.value.length === 0) {
    // 首次打开时加载默认数据
    await searchInvoices('', 1, false)
  }
}

// 组件初始化
const initialize = async () => {
  // 如果有预设值，先加载对应的发票信息
  if (props.modelValue) {
    await loadInvoiceById(props.modelValue)
  }
}

// 组件挂载时初始化
initialize()
</script>

<style scoped>
.invoice-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.invoice-number {
  font-weight: 500;
  color: #333;
}

.invoice-info {
  font-size: 12px;
  color: #666;
}

:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
  line-height: 1.4;
}

:deep(.el-select-dropdown__item.is-disabled) {
  padding: 4px 20px;
}
</style>
