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
    sent: '已发送',
    paid: '已支付',
    overdue: '逾期',
    cancelled: '已取消'
  }
  return statusMap[status] || status
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

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 组件挂载时获取数据
onMounted(() => {
  fetchInvoice()
})
</script>
