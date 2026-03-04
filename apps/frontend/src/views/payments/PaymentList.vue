<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">支付管理</h2>
      <el-button type="primary" @click="$router.push('/payments/create')">
        <el-icon><Plus /></el-icon>
        新建支付
      </el-button>
    </div>
    
    <div class="table-container">
      <div class="table-toolbar">
        <div class="table-search">
          <InvoiceSelect
            v-model="invoiceFilter"
            placeholder="选择发票筛选（支持搜索）"
            width="250px"
            @change="handleInvoiceFilter"
          />
          <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 120px" @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="待处理" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
          </el-select>
        </div>
      </div>
      
      <SkeletonLoader v-if="loading && currentPage === 1" type="table" :rows="10" :columns="10" />
      <div v-else class="table-infinite-container" v-infinite-scroll="loadMore" :infinite-scroll-disabled="disabled">
        <el-table
          :data="payments"
          style="width: 100%"
      >
        <el-table-column prop="id" label="支付ID" width="80" />
        <el-table-column prop="invoice.invoice_number" label="发票编号" width="150" />
        <el-table-column label="合同编号" width="140">
          <template #default="{ row }">
            <el-link
              v-if="row.invoice?.contract?.contract_number"
              type="primary"
              @click="viewContract(row.invoice.contract.id)"
              :underline="false"
            >
              {{ row.invoice.contract.contract_number }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="invoice.contract.title" label="合同标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="invoice.contract.customer.name" label="客户名称" width="150" />
        <el-table-column prop="amount" label="支付金额" width="120">
          <template #default="{ row }">
            ¥{{ formatCurrency(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="payment_date" label="支付日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.payment_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="payment_method" label="支付方式" width="120">
          <template #default="{ row }">
            {{ getPaymentMethodText(row.payment_method) }}
          </template>
        </el-table-column>
        <el-table-column prop="reference_number" label="参考号" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewPayment(row.id)">查看</el-button>
            <el-button size="small" type="primary" @click="editPayment(row.id)">编辑</el-button>
            <el-button size="small" type="danger" @click="deletePayment(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>
      
      <div class="load-more-status" v-if="payments.length > 0">
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
import { paymentApi } from '@/api'
import { useKitStore } from '@/stores/kit'
import type { Payment, Invoice } from '@/api/types'
import InvoiceSelect from '@/components/InvoiceSelect.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

const router = useRouter()
const route = useRoute()
const kitStore = useKitStore()

// 状态
const loading = ref(false)
const payments = ref<Payment[]>([])
const invoiceFilter = ref<number | null>(null)
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const noMore = ref(false)

const disabled = computed(() => loading.value || noMore.value)

watch([() => kitStore.viewAllKits, () => kitStore.currentKitId], () => {
  fetchPayments(false)
})

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount)
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('zh-CN')
}

// 获取支付方式文本
const getPaymentMethodText = (method: string) => {
  const methodMap = {
    cash: '现金',
    bank_transfer: '银行转账',
    check: '支票',
    credit_card: '信用卡',
    other: '其他'
  }
  return methodMap[method] || method
}

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap = {
    pending: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap = {
    pending: '待处理',
    completed: '已完成',
    failed: '失败'
  }
  return statusMap[status] || status
}

// 获取支付记录列表
const fetchPayments = async (append = false) => {
  try {
    if (!append) {
      currentPage.value = 1
      payments.value = []
      noMore.value = false
    }
    
    loading.value = true
    const response = await paymentApi.getPayments({
      page: currentPage.value,
      limit: pageSize.value,
      invoiceId: invoiceFilter.value || undefined,
      status: statusFilter.value,
      viewAll: kitStore.viewAllKits
    })

    if (response.success && response.data) {
      const newItems = response.data.items || []
      const totalCount = response.data.total
      
      if (append) {
        payments.value = [...payments.value, ...newItems]
      } else {
        payments.value = newItems
      }
      
      total.value = totalCount
      if (payments.value.length >= totalCount || newItems.length < pageSize.value) {
        noMore.value = true
      }
    }
  } catch (error) {
    console.error('Failed to fetch payments:', error)
    noMore.value = true // 出错时停止无限滚动，防止无限重试
  } finally {
    loading.value = false
  }
}

// 发票筛选处理
const handleInvoiceFilter = (invoiceId: number | null, invoice: any) => {
  invoiceFilter.value = invoiceId
  fetchPayments(false)
}

// 筛选处理
const handleFilter = () => {
  fetchPayments(false)
}

// 无限滚动加载更多
const loadMore = () => {
  if (disabled.value) return
  currentPage.value++
  fetchPayments(true)
}

// 查看支付记录
const viewPayment = (id: number) => {
  router.push(`/payments/${id}`)
}

// 编辑支付记录
const editPayment = (id: number) => {
  router.push(`/payments/${id}/edit`)
}

// 删除支付记录
const deletePayment = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条支付记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await paymentApi.deletePayment(id, {
      viewAll: kitStore.viewAllKits,
    })
    if (response.success) {
      ElMessage.success('删除成功')
      fetchPayments()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete payment:', error)
    }
  }
}

// 查看合同
const viewContract = (id: number) => {
  router.push(`/contracts/${id}`)
}

// 初始化URL参数
const initFromUrlParams = () => {
  // 从URL查询参数初始化筛选条件（用于从Dashboard跳转）
  const { status, invoiceId } = route.query
  
  if (status && typeof status === 'string') {
    statusFilter.value = status
  }
  
  if (invoiceId) {
    const id = parseInt(invoiceId as string, 10)
    if (!isNaN(id)) {
      invoiceFilter.value = id
    }
  }
}

// 组件挂载时获取数据
onMounted(() => {
  // 先初始化URL参数，再获取数据
  initFromUrlParams()
  fetchPayments()
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
