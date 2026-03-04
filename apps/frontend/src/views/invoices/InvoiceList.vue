<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">发票管理</h2>
      <el-button type="primary" @click="$router.push('/invoices/create')">
        <el-icon><Plus /></el-icon>
        新建发票
      </el-button>
    </div>
    
    <div class="table-container">
      <div class="table-toolbar">
        <div class="table-search">
          <ContractSelect
            v-model="contractFilter"
            placeholder="选择合同筛选（支持搜索）"
            width="250px"
            @change="handleContractFilter"
          />
          <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 120px" @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="已开票" value="sent" />
            <el-option label="已支付" value="paid" />
            <el-option label="逾期" value="overdue" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </div>
      </div>
      
      <SkeletonLoader v-if="loading && currentPage === 1" type="table" :rows="10" :columns="8" />
      <div v-else class="table-infinite-container" v-infinite-scroll="loadMore" :infinite-scroll-disabled="disabled">
        <el-table
          :data="invoices"
          style="width: 100%"
      >
        <el-table-column prop="invoice_number" label="发票编号" width="150" />
        <el-table-column prop="contract.title" label="合同标题" />
        <el-table-column prop="contract.customer.name" label="客户名称" />
        <el-table-column prop="total_amount" label="发票金额" width="120">
          <template #default="{ row }">
            ¥{{ formatCurrency(row.total_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="issue_date" label="开票日期" width="120" />
        <el-table-column prop="due_date" label="到期日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewInvoice(row.id)">查看</el-button>
            <el-button size="small" type="primary" @click="editInvoice(row.id)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteInvoice(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>
      
      <div class="load-more-status" v-if="invoices.length > 0">
        <p v-if="loading">加载中...</p>
        <p v-if="noMore">没有更多数据了</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { invoiceApi } from '@/api'
import { useKitStore } from '@/stores/kit'
import type { Invoice, Contract } from '@/api/types'
import ContractSelect from '@/components/ContractSelect.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

const router = useRouter()
const route = useRoute()
const kitStore = useKitStore()

// 状态
const loading = ref(false)
const invoices = ref<Invoice[]>([])
const contractFilter = ref<number | null>(null)
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const noMore = ref(false)

const disabled = computed(() => loading.value || noMore.value)

watch([() => kitStore.viewAllKits, () => kitStore.currentKitId], () => {
  fetchInvoices(false)
})

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount)
}

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap = {
    draft: 'info',
    sent: 'warning',
    paid: 'success',
    overdue: 'danger',
    cancelled: 'primary'
  }
  return statusMap[status] || 'info'
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

// 获取发票列表
const fetchInvoices = async (append = false) => {
  try {
    if (!append) {
      currentPage.value = 1
      invoices.value = []
      noMore.value = false
    }
    
    loading.value = true
    const response = await invoiceApi.getInvoices({
      page: currentPage.value,
      limit: pageSize.value,
      contractId: contractFilter.value || undefined,
      status: statusFilter.value,
      viewAll: kitStore.viewAllKits
    })

    if (response.success && response.data) {
      const newItems = response.data.items || []
      const totalCount = response.data.total
      
      if (append) {
        invoices.value = [...invoices.value, ...newItems]
      } else {
        invoices.value = newItems
      }
      
      total.value = totalCount
      if (invoices.value.length >= totalCount || newItems.length < pageSize.value) {
        noMore.value = true
      }
    }
  } catch (error) {
    console.error('Failed to fetch invoices:', error)
    noMore.value = true // 出错时停止无限滚动，防止无限重试
  } finally {
    loading.value = false
  }
}

// 合同筛选处理
const handleContractFilter = (contractId: number | null, contract: any) => {
  contractFilter.value = contractId
  fetchInvoices(false)
}

// 筛选处理
const handleFilter = () => {
  fetchInvoices(false)
}

// 无限滚动加载更多
const loadMore = () => {
  if (disabled.value) return
  currentPage.value++
  fetchInvoices(true)
}

// 查看发票
const viewInvoice = (id: number) => {
  router.push(`/invoices/${id}`)
}

// 编辑发票
const editInvoice = (id: number) => {
  router.push(`/invoices/${id}/edit`)
}

// 删除发票
const deleteInvoice = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这张发票吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await invoiceApi.deleteInvoice(id, {
      viewAll: kitStore.viewAllKits,
    })
    if (response.success) {
      ElMessage.success('删除成功')
      fetchInvoices()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete invoice:', error)
    }
  }
}

// 初始化URL参数
const initFromUrlParams = () => {
  // 从URL查询参数初始化筛选条件（用于从Dashboard跳转）
  const { status, contractId } = route.query
  
  if (status && typeof status === 'string') {
    statusFilter.value = status
  }
  
  if (contractId) {
    const id = parseInt(contractId as string, 10)
    if (!isNaN(id)) {
      contractFilter.value = id
    }
  }
}

// 组件挂载时获取数据
onMounted(() => {
  // 先初始化URL参数，再获取数据
  initFromUrlParams()
  fetchInvoices()
})
</script>

<style scoped>
.table-infinite-container {
  overflow-y: auto;
  max-height: calc(100vh - 250px);
}

.load-more-status {
  text-align: center;
  padding: 20px 0;
  color: #909399;
  font-size: 14px;
}
</style>
