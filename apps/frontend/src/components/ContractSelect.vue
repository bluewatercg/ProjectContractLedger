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
      v-for="contract in contracts"
      :key="contract.id"
      :label="contract.title"
      :value="contract.id"
    >
      <div class="contract-option">
        <div class="contract-title">{{ contract.title }}</div>
        <div class="contract-info">{{ contract.contract_number }} | ¥{{ formatCurrency(contract.total_amount) }}</div>
      </div>
    </el-option>
    
    <!-- 加载更多指示器 -->
    <el-option
      v-if="hasMore && contracts.length > 0"
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
      v-if="!loading && contracts.length === 0 && searchKeyword"
      :value="'no-data'"
      disabled
      style="text-align: center; color: #999;"
    >
      未找到相关合同
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import { contractApi } from '@/api'
import type { Contract } from '@/api/types'

// Props
interface Props {
  modelValue?: number | null
  placeholder?: string
  width?: string
  disabled?: boolean
  customerId?: number // 可选的客户ID筛选
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择合同',
  width: '100%',
  disabled: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [value: number | null, contract: Contract | null]
}>()

// 状态
const selectedValue = ref<number | null>(props.modelValue || null)
const contracts = ref<Contract[]>([])
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

// 监听外部值变化
watch(() => props.modelValue, async (newValue) => {
  selectedValue.value = newValue || null
  // 如果有新值且当前合同列表中没有该合同，则加载该合同信息
  if (newValue && !contracts.value.find(c => c.id === newValue)) {
    await loadContractById(newValue)
  }
})

// 监听内部值变化
watch(selectedValue, (newValue) => {
  emit('update:modelValue', newValue)
})

// 根据ID加载单个合同信息
const loadContractById = async (contractId: number) => {
  try {
    const response = await contractApi.getContractById(contractId)
    if (response.success && response.data) {
      // 检查合同是否已存在于列表中
      const existingIndex = contracts.value.findIndex(c => c.id === contractId)
      if (existingIndex === -1) {
        // 将合同添加到列表开头
        contracts.value.unshift(response.data)
      } else {
        // 更新现有合同信息
        contracts.value[existingIndex] = response.data
      }
    }
  } catch (error) {
    console.error('Failed to load contract by id:', error)
  }
}

// 搜索合同
const searchContracts = async (keyword: string = '', page: number = 1, append: boolean = false) => {
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

    // 如果指定了客户ID，添加筛选条件
    if (props.customerId) {
      params.customerId = props.customerId
    }

    const response = await contractApi.getContracts(params)

    if (response.success && response.data) {
      const newContracts = response.data.items
      
      if (append) {
        contracts.value = [...contracts.value, ...newContracts]
      } else {
        contracts.value = newContracts
      }
      
      currentPage.value = page
      hasMore.value = page < response.data.totalPages
    }
  } catch (error) {
    console.error('Failed to search contracts:', error)
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
    searchContracts(keyword, 1, false)
  }, 300) // 300ms 防抖
}

// 加载更多
const loadMore = async () => {
  if (hasMore.value && !loadingMore.value) {
    await searchContracts(searchKeyword.value, currentPage.value + 1, true)
  }
}

// 处理选择变化
const handleChange = (value: number | null) => {
  const contract = contracts.value.find(c => c.id === value) || null
  emit('change', value, contract)
}

// 处理下拉框显示/隐藏
const handleVisibleChange = async (visible: boolean) => {
  if (visible && contracts.value.length === 0) {
    // 首次打开时加载默认数据
    await searchContracts('', 1, false)
  }
}

// 组件初始化
const initialize = async () => {
  // 如果有预设值，先加载对应的合同信息
  if (props.modelValue) {
    await loadContractById(props.modelValue)
  }
}

// 组件挂载时初始化
initialize()
</script>

<style scoped>
.contract-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contract-title {
  font-weight: 500;
  color: #333;
}

.contract-info {
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
