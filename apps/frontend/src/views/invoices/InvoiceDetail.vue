<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">发票详情</h2>
      <div>
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" @click="editInvoice">编辑</el-button>
        <el-button
          v-if="canMarkBadDebt"
          type="danger"
          @click="showBadDebtDialog = true"
        >
          标记坏账
        </el-button>
        <el-button
          v-if="hasBadDebt"
          type="warning"
          @click="handleUndoBadDebt"
        >
          撤销坏账
        </el-button>
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
        <el-descriptions-item label="到期日期">{{ invoice.due_date || '-' }}</el-descriptions-item>
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

      <!-- 发票附件 -->
      <div v-if="invoice" class="mt-6">
        <h3 class="text-lg font-semibold mb-4">发票附件</h3>

        <!-- 文件上传 -->
        <div class="mb-4">
          <FileUpload
            :upload-url="`/invoices/${invoiceId}/attachments`"
            @success="handleAttachmentUpload"
            @error="handleUploadError"
          />
        </div>

        <!-- 附件列表 -->
        <AttachmentList
          :attachments="attachments"
          :loading="attachmentsLoading"
          attachment-type="invoice"
          @delete="handleDeleteAttachment"
          @refresh="fetchAttachments"
        />
      </div>
    </div>

    <!-- 坏账信息卡片 -->
    <div v-if="hasBadDebt" class="mt-6">
      <el-card>
        <template #header>
          <div class="flex items-center">
            <span class="font-semibold text-red-600">坏账信息</span>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="坏账金额">
            <span class="text-red-600 font-semibold">¥{{ formatCurrency(badDebtAmount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="坏账原因">{{ badDebtReason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="标记时间">{{ badDebtMarkedAt || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <!-- 标记坏账对话框 -->
    <el-dialog
      v-model="showBadDebtDialog"
      title="标记坏账"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="badDebtForm" label-width="120px">
        <el-form-item label="坏账金额" required>
          <el-input-number
            v-model="badDebtForm.bad_debt_amount"
            :min="0.01"
            :max="unpaidAmount"
            :precision="2"
            :step="100"
            style="width: 100%"
          />
          <div class="form-tip">
            未收金额：¥{{ formatCurrency(unpaidAmount) }}
          </div>
        </el-form-item>
        <el-form-item label="坏账原因" required>
          <el-input
            v-model="badDebtForm.bad_debt_reason"
            type="textarea"
            :rows="4"
            placeholder="请输入坏账原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBadDebtDialog = false">取消</el-button>
        <el-button type="danger" :loading="badDebtLoading" @click="handleMarkBadDebt">
          确认标记
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { invoiceApi } from '@/api'
import { attachmentApi } from '@/api/attachment'
import { badDebtApi } from '@/api/badDebt'
import { useKitStore } from '@/stores/kit'
import type { Invoice } from '@/api/types'
import type { Attachment } from '@/api/attachment'
import FileUpload from '@/components/FileUpload.vue'
import AttachmentList from '@/components/AttachmentList.vue'

const router = useRouter()
const route = useRoute()
const kitStore = useKitStore()

// 状态
const loading = ref(false)
const invoice = ref<Invoice>()
const attachments = ref<Attachment[]>([])
const attachmentsLoading = ref(false)

// 坏账相关状态
const showBadDebtDialog = ref(false)
const badDebtLoading = ref(false)
const badDebtForm = ref({ bad_debt_amount: 0, bad_debt_reason: '' })

// 计算属性
const invoiceId = computed(() => Number(route.params.id))

// 是否可以标记坏账（sent 或 overdue 状态）
const canMarkBadDebt = computed(() => {
  if (!invoice.value) return false
  return ['sent', 'overdue'].includes(invoice.value.status)
})

// 是否已有坏账
const hasBadDebt = computed(() => {
  return !!invoice.value?.bad_debt_amount && Number(invoice.value.bad_debt_amount) > 0
})

// 坏账金额
const badDebtAmount = computed(() => {
  return Number(invoice.value?.bad_debt_amount || 0)
})

// 坏账原因
const badDebtReason = computed(() => {
  return invoice.value?.bad_debt_reason || '-'
})

// 坏账标记时间
const badDebtMarkedAt = computed(() => {
  if (!invoice.value?.bad_debt_marked_at) return '-'
  return new Date(invoice.value.bad_debt_marked_at).toLocaleString('zh-CN')
})

// 未收款金额
const unpaidAmount = computed(() => {
  if (!invoice.value) return 0
  return Number(invoice.value.total_amount) - getPaidAmount()
})

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
    cancelled: 'primary',
    bad_debt: 'danger'
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
    cancelled: '已取消',
    bad_debt: '坏账'
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

// 获取发票详情
const fetchInvoice = async () => {
  try {
    loading.value = true
    const response = await invoiceApi.getInvoiceById(invoiceId.value, {
      viewAll: kitStore.viewAllKits,
    })

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

// 标记坏账
const handleMarkBadDebt = async () => {
  if (badDebtForm.value.bad_debt_amount <= 0) {
    ElMessage.warning('坏账金额必须大于 0')
    return
  }
  if (!badDebtForm.value.bad_debt_reason) {
    ElMessage.warning('请填写坏账原因')
    return
  }

  try {
    badDebtLoading.value = true
    const response = await badDebtApi.markAsBadDebt({
      invoice_id: invoiceId.value,
      bad_debt_amount: badDebtForm.value.bad_debt_amount,
      bad_debt_reason: badDebtForm.value.bad_debt_reason,
    })
    if (response.success) {
      ElMessage.success('已标记为坏账')
      showBadDebtDialog.value = false
      badDebtForm.value = { bad_debt_amount: 0, bad_debt_reason: '' }
      await fetchInvoice()
    } else {
      ElMessage.error(response.message || '标记坏账失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '标记坏账失败')
  } finally {
    badDebtLoading.value = false
  }
}

// 撤销坏账
const handleUndoBadDebt = async () => {
  try {
    await ElMessageBox.confirm('确认撤销该发票的坏账标记？撤销后发票状态将恢复为逾期。', '确认撤销', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  try {
    const response = await badDebtApi.undoBadDebt(invoiceId.value)
    if (response.success) {
      ElMessage.success('已撤销坏账')
      await fetchInvoice()
    } else {
      ElMessage.error(response.message || '撤销坏账失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '撤销坏账失败')
  }
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 获取附件列表
const fetchAttachments = async () => {
  try {
    attachmentsLoading.value = true
    const response = await attachmentApi.getInvoiceAttachments(invoiceId.value)

    if (response.success && response.data) {
      attachments.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch attachments:', error)
    ElMessage.error('获取附件列表失败')
  } finally {
    attachmentsLoading.value = false
  }
}

// 处理附件上传成功
const handleAttachmentUpload = (attachment: Attachment) => {
  attachments.value.unshift(attachment)
  ElMessage.success('附件上传成功')
}

// 处理上传错误
const handleUploadError = (error: any) => {
  console.error('Upload error:', error)
  ElMessage.error('附件上传失败')
}

// 删除附件
const handleDeleteAttachment = async (attachmentId: number) => {
  try {
    const response = await attachmentApi.deleteInvoiceAttachment(
      invoiceId.value,
      attachmentId
    )

    if (response.success) {
      attachments.value = attachments.value.filter(
        item => item.attachment_id !== attachmentId
      )
      ElMessage.success('附件删除成功')
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    console.error('Delete error:', error)
    ElMessage.error('删除附件失败')
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchInvoice()
  fetchAttachments()
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
