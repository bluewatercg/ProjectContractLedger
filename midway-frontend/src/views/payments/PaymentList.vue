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
      
      <el-table
        v-loading="loading"
        :data="payments"
        style="width: 100%"
      >
        <el-table-column prop="id" label="支付ID" width="80" />
        <el-table-column prop="invoice.invoice_number" label="发票编号" width="150" />
        <el-table-column prop="invoice.contract.customer.name" label="客户名称" />
        <el-table-column prop="amount" label="支付金额" width="120">
          <template #default="{ row }">
            ¥{{ formatCurrency(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="payment_date" label="支付日期" width="120" />
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
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { paymentApi } from '@/api'
import type { Payment, Invoice } from '@/api/types'
import InvoiceSelect from '@/components/InvoiceSelect.vue'

const router = useRouter()

// 状态
const loading = ref(false)
const payments = ref<Payment[]>([])
const invoiceFilter = ref<number | null>(null)
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount)
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
const fetchPayments = async () => {
  try {
    loading.value = true
    const response = await paymentApi.getPayments({
      page: currentPage.value,
      limit: pageSize.value,
      invoiceId: invoiceFilter.value || undefined,
      status: statusFilter.value
    })

    if (response.success && response.data) {
      payments.value = response.data.items
      total.value = response.data.total
    }
  } catch (error) {
    console.error('Failed to fetch payments:', error)
  } finally {
    loading.value = false
  }
}

// 发票筛选处理
const handleInvoiceFilter = (invoiceId: number | null, invoice: any) => {
  invoiceFilter.value = invoiceId
  currentPage.value = 1
  fetchPayments()
}

// 筛选处理
const handleFilter = () => {
  currentPage.value = 1
  fetchPayments()
}

// 分页处理
const handleSizeChange = () => {
  currentPage.value = 1
  fetchPayments()
}

const handleCurrentChange = () => {
  fetchPayments()
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
    
    const response = await paymentApi.deletePayment(id)
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

// 组件挂载时获取数据
onMounted(() => {
  fetchPayments()
})
</script>

<style scoped>
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
