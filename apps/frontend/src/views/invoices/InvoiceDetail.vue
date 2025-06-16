<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">发票详情</h2>
      <div>
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" @click="editInvoice">编辑</el-button>
      </div>
    </div>

    <div v-loading="loading">
      <!-- 发票基本信息 -->
      <el-descriptions v-if="invoice" :column="2" border>
        <el-descriptions-item label="发票编号">{{ invoice.invoice_number }}</el-descriptions-item>
        <el-descriptions-item label="合同标题">{{ invoice.contract?.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ invoice.contract?.customer?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发票金额">¥{{ formatCurrency(invoice.amount) }}</el-descriptions-item>
        <el-descriptions-item label="税率">{{ invoice.tax_rate }}%</el-descriptions-item>
        <el-descriptions-item label="税额">¥{{ formatCurrency(invoice.tax_amount) }}</el-descriptions-item>
        <el-descriptions-item label="总金额">¥{{ formatCurrency(invoice.total_amount) }}</el-descriptions-item>
        <el-descriptions-item label="开票日期">{{ invoice.issue_date }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(invoice.status)">
            {{ getStatusText(invoice.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(invoice.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="发票描述" :span="2">{{ invoice.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ invoice.notes || '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 支付情况 -->
      <div v-if="invoice" class="mt-6">
        <h3 class="text-lg font-semibold mb-4">支付情况</h3>

        <!-- 支付统计 -->
        <div class="payment-summary mb-4">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card class="summary-card">
                <div class="summary-item">
                  <div class="summary-label">发票总额</div>
                  <div class="summary-value total">¥{{ formatCurrency(invoice.total_amount) }}</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="summary-card">
                <div class="summary-item">
                  <div class="summary-label">已收款</div>
                  <div class="summary-value paid">¥{{ formatCurrency(getPaidAmount()) }}</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="summary-card">
                <div class="summary-item">
                  <div class="summary-label">未收款</div>
                  <div class="summary-value unpaid">¥{{ formatCurrency(getUnpaidAmount()) }}</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 支付记录表格 -->
        <div v-if="invoice.payments && invoice.payments.length > 0">
          <el-table :data="invoice.payments" border style="width: 100%">
            <el-table-column prop="id" label="支付ID" width="80" />
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
                <el-tag :type="getPaymentStatusType(row.status)">
                  {{ getPaymentStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="notes" label="备注" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="viewPayment(row.id)">查看</el-button>
                <el-button size="small" type="primary" @click="editPayment(row.id)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 无支付记录时的提示 -->
        <div v-else class="text-center py-8 text-gray-500">
          <p>该发票暂无支付记录</p>
          <el-button type="primary" class="mt-4" @click="createPayment">添加支付记录</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { invoiceApi } from '@/api'
import type { Invoice } from '@/api/types'

const router = useRouter()
const route = useRoute()

// 状态
const loading = ref(false)
const invoice = ref<Invoice>()

// 计算属性
const invoiceId = computed(() => Number(route.params.id))

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount)
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
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
const getPaymentStatusType = (status: string) => {
  const statusMap = {
    pending: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取支付状态文本
const getPaymentStatusText = (status: string) => {
  const statusMap = {
    pending: '待处理',
    completed: '已完成',
    failed: '失败'
  }
  return statusMap[status] || status
}

// 计算已收款金额
const getPaidAmount = () => {
  if (!invoice.value?.payments || !Array.isArray(invoice.value.payments)) {
    return 0
  }
  return invoice.value.payments
    .filter(payment => payment.status === 'completed')
    .reduce((sum, payment) => sum + Number(payment.amount), 0)
}

// 计算未收款金额
const getUnpaidAmount = () => {
  if (!invoice.value) return 0
  return Number(invoice.value.total_amount) - getPaidAmount()
}

// 获取发票详情
const fetchInvoice = async () => {
  try {
    loading.value = true
    const response = await invoiceApi.getInvoiceById(invoiceId.value)

    if (response.success && response.data) {
      invoice.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch invoice:', error)
    ElMessage.error('获取发票信息失败')
  } finally {
    loading.value = false
  }
}

// 编辑发票
const editInvoice = () => {
  router.push(`/invoices/${invoiceId.value}/edit`)
}

// 查看支付详情
const viewPayment = (paymentId: number) => {
  router.push(`/payments/${paymentId}`)
}

// 编辑支付记录
const editPayment = (paymentId: number) => {
  router.push(`/payments/${paymentId}/edit`)
}

// 创建支付记录
const createPayment = () => {
  router.push(`/payments/create?invoiceId=${invoiceId.value}`)
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 组件挂载时获取数据
onMounted(() => {
  fetchInvoice()
})
</script>

<style scoped>
.payment-summary {
  margin-bottom: 20px;
}

.summary-card {
  text-align: center;
  border-radius: 8px;
}

.summary-item {
  padding: 10px;
}

.summary-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.summary-value.total {
  color: #409eff;
}

.summary-value.paid {
  color: #67c23a;
}

.summary-value.unpaid {
  color: #f56c6c;
}

.text-gray-500 {
  color: #9ca3af;
}

.mt-4 {
  margin-top: 1rem;
}

.mt-6 {
  margin-top: 1.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.text-lg {
  font-size: 1.125rem;
}

.font-semibold {
  font-weight: 600;
}

.text-center {
  text-align: center;
}

.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}
</style>
