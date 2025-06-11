<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">支付详情</h2>
      <div>
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" @click="editPayment">编辑</el-button>
      </div>
    </div>
    
    <div v-loading="loading">
      <el-descriptions v-if="payment" :column="2" border>
        <el-descriptions-item label="支付ID">{{ payment.id }}</el-descriptions-item>
        <el-descriptions-item label="关联发票">{{ payment.invoice?.invoice_number || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ payment.invoice?.contract?.customer?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="合同标题">{{ payment.invoice?.contract?.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付金额">¥{{ formatCurrency(payment.amount) }}</el-descriptions-item>
        <el-descriptions-item label="支付日期">{{ formatDate(payment.payment_date) }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ getPaymentMethodText(payment.payment_method) }}</el-descriptions-item>
        <el-descriptions-item label="参考号码">{{ payment.reference_number || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag :type="getStatusType(payment.status)">{{ getStatusText(payment.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(payment.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDate(payment.updated_at) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          <div class="notes-content">{{ payment.notes || '-' }}</div>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 关联发票信息 -->
      <div v-if="payment?.invoice" class="related-info">
        <h3>关联发票信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="发票编号">{{ payment.invoice.invoice_number }}</el-descriptions-item>
          <el-descriptions-item label="发票金额">¥{{ formatCurrency(payment.invoice.amount) }}</el-descriptions-item>
          <el-descriptions-item label="税率">{{ payment.invoice.tax_rate }}%</el-descriptions-item>
          <el-descriptions-item label="税额">¥{{ formatCurrency(payment.invoice.tax_amount) }}</el-descriptions-item>
          <el-descriptions-item label="总金额">¥{{ formatCurrency(payment.invoice.total_amount) }}</el-descriptions-item>
          <el-descriptions-item label="发票状态">
            <el-tag :type="getInvoiceStatusType(payment.invoice.status)">
              {{ getInvoiceStatusText(payment.invoice.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开票日期">{{ formatDate(payment.invoice.issue_date) }}</el-descriptions-item>
          <el-descriptions-item label="到期日期">{{ formatDate(payment.invoice.due_date) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { paymentApi } from '@/api'
import type { Payment } from '@/api/types'

const router = useRouter()
const route = useRoute()

// 状态
const loading = ref(false)
const payment = ref<Payment>()

// 计算属性
const paymentId = computed(() => Number(route.params.id))

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount)
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
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

// 获取支付状态类型
const getStatusType = (status: string) => {
  const statusMap = {
    pending: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return statusMap[status] || ''
}

// 获取支付状态文本
const getStatusText = (status: string) => {
  const statusMap = {
    pending: '待处理',
    completed: '已完成',
    failed: '失败'
  }
  return statusMap[status] || status
}

// 获取发票状态类型
const getInvoiceStatusType = (status: string) => {
  const statusMap = {
    draft: '',
    sent: 'warning',
    paid: 'success',
    overdue: 'danger',
    cancelled: 'info'
  }
  return statusMap[status] || ''
}

// 获取发票状态文本
const getInvoiceStatusText = (status: string) => {
  const statusMap = {
    draft: '草稿',
    sent: '已发送',
    paid: '已支付',
    overdue: '逾期',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

// 获取支付详情
const fetchPayment = async () => {
  try {
    loading.value = true
    const response = await paymentApi.getPaymentById(paymentId.value)
    
    if (response.success && response.data) {
      payment.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch payment:', error)
    ElMessage.error('获取支付信息失败')
  } finally {
    loading.value = false
  }
}

// 编辑支付
const editPayment = () => {
  router.push(`/payments/${paymentId.value}/edit`)
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 组件挂载时获取数据
onMounted(() => {
  fetchPayment()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.notes-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.related-info {
  margin-top: 30px;
}

.related-info h3 {
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
</style>
