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
      v-for="customer in customers"
      :key="customer.id"
      :label="customer.name"
      :value="customer.id"
    >
      <div class="customer-option">
        <div class="customer-name">{{ customer.name }}</div>
        <div class="customer-info">{{ customer.contact_person }} | {{ customer.phone }}</div>
      </div>
    </el-option>
    
    <!-- 加载更多指示器 -->
    <el-option
      v-if="hasMore && customers.length > 0"
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
      v-if="!loading && customers.length === 0 && searchKeyword"
      :value="'no-data'"
      disabled
      style="text-align: center; color: #999;"
    >
      未找到相关客户
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import { customerApi } from '@/api'
import type { Customer } from '@/api/types'

// Props
interface Props {
  modelValue?: number | null
  placeholder?: string
  width?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择客户',
  width: '100%',
  disabled: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [value: number | null, customer: Customer | null]
}>()

// 状态
const selectedValue = ref<number | null>(props.modelValue || null)
const customers = ref<Customer[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const hasMore = ref(true)
const pageSize = 10

// 防抖定时器
let searchTimer: NodeJS.Timeout | null = null

// 监听外部值变化
watch(() => props.modelValue, async (newValue) => {
  selectedValue.value = newValue || null
  // 如果有新值且当前客户列表中没有该客户，则加载该客户信息
  if (newValue && !customers.value.find(c => c.id === newValue)) {
    await loadCustomerById(newValue)
  }
})

// 监听内部值变化
watch(selectedValue, (newValue) => {
  emit('update:modelValue', newValue)
})

// 根据ID加载单个客户信息
const loadCustomerById = async (customerId: number) => {
  try {
    const response = await customerApi.getCustomerById(customerId)
    if (response.success && response.data) {
      // 检查客户是否已存在于列表中
      const existingIndex = customers.value.findIndex(c => c.id === customerId)
      if (existingIndex === -1) {
        // 将客户添加到列表开头
        customers.value.unshift(response.data)
      } else {
        // 更新现有客户信息
        customers.value[existingIndex] = response.data
      }
    }
  } catch (error) {
    console.error('Failed to load customer by id:', error)
  }
}

// 搜索客户
const searchCustomers = async (keyword: string = '', page: number = 1, append: boolean = false) => {
  try {
    if (page === 1) {
      loading.value = true
    } else {
      loadingMore.value = true
    }

    const response = await customerApi.getCustomers({
      page,
      limit: pageSize,
      search: keyword.trim(),
      sortBy: 'name',
      sortOrder: 'ASC'
    })

    if (response.success && response.data) {
      const newCustomers = response.data.items

      if (append) {
        customers.value = [...customers.value, ...newCustomers]
      } else {
        customers.value = newCustomers
      }

      currentPage.value = page
      hasMore.value = page < response.data.totalPages
    }
  } catch (error) {
    console.error('Failed to search customers:', error)
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
    searchCustomers(keyword, 1, false)
  }, 300) // 300ms 防抖
}

// 加载更多
const loadMore = async () => {
  if (hasMore.value && !loadingMore.value) {
    await searchCustomers(searchKeyword.value, currentPage.value + 1, true)
  }
}

// 处理选择变化
const handleChange = (value: number | null) => {
  const customer = customers.value.find(c => c.id === value) || null
  emit('change', value, customer)
}

// 处理下拉框显示/隐藏
const handleVisibleChange = async (visible: boolean) => {
  if (visible && customers.value.length === 0) {
    // 首次打开时加载默认数据
    await searchCustomers('', 1, false)
  }
}

// 组件初始化
const initialize = async () => {
  // 如果有预设值，先加载对应的客户信息
  if (props.modelValue) {
    await loadCustomerById(props.modelValue)
  }
}

// 组件挂载时初始化
initialize()
</script>

<style scoped>
.customer-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.customer-name {
  font-weight: 500;
  color: #333;
}

.customer-info {
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
