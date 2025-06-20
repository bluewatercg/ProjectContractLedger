
<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">合同详情</h2>
      <div>
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" @click="editContract">编辑</el-button>
      </div>
    </div>
    
    <div v-loading="loading">
      <el-descriptions v-if="contract" :column="2" border>
        <el-descriptions-item label="合同编号">{{ contract.contract_number }}</el-descriptions-item>
        <el-descriptions-item label="合同标题">{{ contract.title }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ contract.customer?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="合同金额">¥{{ formatCurrency(contract.total_amount) }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ contract.start_date }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ contract.end_date }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(contract.status)">
            {{ getStatusText(contract.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(contract.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="合同描述" :span="2">{{ contract.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="合同条款" :span="2">
          <div style="white-space: pre-wrap;">{{ contract.terms || '-' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ contract.notes || '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 发票和收款信息 -->
      <div v-if="contract && contract.invoices && contract.invoices.length > 0" class="mt-6">
        <h3 class="text-lg font-semibold mb-4">关联发票及收款情况</h3>

        <!-- 汇总统计 -->
        <div class="stats-container">
          <div class="stat-card stat-card-blue">
            <div class="stat-label">发票总数</div>
            <div class="stat-value">{{ invoiceStats.totalCount }}</div>
          </div>
          <div class="stat-card stat-card-green">
            <div class="stat-label">发票总额</div>
            <div class="stat-value">¥{{ formatCurrency(invoiceStats.totalAmount) }}</div>
          </div>
          <div class="stat-card stat-card-purple">
            <div class="stat-label">未开票总额</div>
            <div class="stat-value">¥{{ formatCurrency(invoiceStats.uninvoicedAmount) }}</div>
            <div v-if="invoiceStats.uninvoicedAmount > 0" class="stat-action">
              <el-button 
                type="primary" 
                size="small" 
                @click="goToCreateInvoice"
                class="action-button"
              >
                去开票
              </el-button>
            </div>
          </div>
          <div class="stat-card stat-card-orange">
            <div class="stat-label">已收款</div>
            <div class="stat-value">¥{{ formatCurrency(invoiceStats.paidAmount) }}</div>
          </div>
          <div class="stat-card stat-card-red">
            <div class="stat-label">未收款</div>
            <div class="stat-value">¥{{ formatCurrency(invoiceStats.unpaidAmount) }}</div>
          </div>
        </div>

        <!-- 发票列表 -->
        <el-table :data="contract?.invoices || []" border style="width: 100%">
          <el-table-column prop="invoice_number" label="发票编号" width="150">
            <template #default="scope">
              <el-link
                type="primary"
                @click="goToViewInvoice(scope.row.id)"
                :underline="false"
                class="invoice-link"
              >
                {{ scope.row.invoice_number }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="发票金额" width="120">
            <template #default="scope">
              ¥{{ formatCurrency(scope.row.total_amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="issue_date" label="开票日期" width="120">
            <template #default="scope">
              {{ formatDate(scope.row.issue_date) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="发票状态" width="100">
            <template #default="scope">
              <el-tag :type="getInvoiceStatusType(scope.row.status)">
                {{ getInvoiceStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="收款情况" min-width="300">
            <template #default="scope">
              <div>
                <!-- 收款记录列表 -->
                <div v-if="scope.row.payments && scope.row.payments.length > 0">
                  <div v-for="payment in scope.row.payments" :key="payment.id" class="payment-item">
                    <div class="payment-header">
                      <div class="payment-amount">
                        <span class="amount-text">¥{{ formatCurrency(payment.amount) }}</span>
                        <span class="date-text">{{ formatDate(payment.payment_date) }}</span>
                      </div>
                      <div class="payment-tags">
                        <el-tag size="small" :type="getPaymentStatusType(payment.status)">
                          {{ getPaymentStatusText(payment.status) }}
                        </el-tag>
                        <el-tag size="small" type="info">
                          {{ getPaymentMethodText(payment.payment_method) }}
                        </el-tag>
                      </div>
                    </div>
                    <div v-if="payment.reference_number" class="reference-number">
                      参考号: {{ payment.reference_number }}
                    </div>
                  </div>
                </div>
                <div v-else class="text-gray-500 text-sm mb-2">暂无收款记录</div>

                <!-- 收款汇总和操作按钮 -->
                <div class="payment-summary">
                  已收: ¥{{ formatCurrency(getInvoicePaidAmount(scope.row)) }} /
                  未收: ¥{{ formatCurrency(scope.row.total_amount - getInvoicePaidAmount(scope.row)) }}
                  <el-button
                    v-if="scope.row.total_amount - getInvoicePaidAmount(scope.row) > 0"
                    type="primary"
                    size="small"
                    @click="goToCreatePayment(scope.row.id)"
                    class="ml-2"
                  >
                    去收款
                  </el-button>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 无发票时的提示 -->
      <div v-else-if="contract && (!contract.invoices || contract.invoices.length === 0)" class="mt-6">
        <h3 class="text-lg font-semibold mb-4">关联发票及收款情况</h3>
        <div class="text-center py-8 text-gray-500">
          <p>该合同暂无关联发票</p>
          <el-button
            type="primary"
            @click="goToCreateInvoice"
            class="mt-4"
          >
            立即开票
          </el-button>
        </div>
      </div>

      <!-- 合同附件 -->
      <div v-if="contract" class="mt-6">
        <h3 class="text-lg font-semibold mb-4">合同附件</h3>

        <!-- 文件上传 -->
        <div class="mb-4">
          <FileUpload
            :upload-url="`/contracts/${contractId}/attachments`"
            @success="handleAttachmentUpload"
            @error="handleUploadError"
          />
        </div>

        <!-- 附件列表 -->
        <AttachmentList
          :attachments="attachments"
          :loading="attachmentsLoading"
          @delete="handleDeleteAttachment"
          @refresh="fetchAttachments"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { contractApi } from '@/api'
import { attachmentApi } from '@/api/attachment'
import type { Contract } from '@/api/types'
import type { Attachment } from '@/api/attachment'
import FileUpload from '@/components/FileUpload.vue'
import AttachmentList from '@/components/AttachmentList.vue'

const router = useRouter()
const route = useRoute()

// 状态
const loading = ref(false)
const contract = ref<Contract>()
const attachments = ref<Attachment[]>([])
const attachmentsLoading = ref(false)

// 计算属性
const contractId = computed(() => Number(route.params.id))

// 安全转换为数字
const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') {
    return 0
  }
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

// 发票统计信息
const invoiceStats = computed(() => {
  if (!contract.value?.invoices || !Array.isArray(contract.value.invoices)) {
    return {
      totalCount: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      uninvoicedAmount: contract.value ? safeNumber(contract.value.total_amount) : 0
    }
  }

  const invoices = contract.value.invoices
  const contractAmount = safeNumber(contract.value.total_amount)
  const totalCount = invoices.length
  const totalAmount = invoices.reduce((sum, invoice) => {
    return sum + safeNumber(invoice.total_amount)
  }, 0)
  const paidAmount = invoices.reduce((sum, invoice) => {
    return sum + getInvoicePaidAmount(invoice)
  }, 0)
  const unpaidAmount = totalAmount - paidAmount
  const uninvoicedAmount = contractAmount - totalAmount

  return {
    totalCount,
    totalAmount,
    paidAmount,
    unpaidAmount,
    uninvoicedAmount
  }
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
    active: 'success',
    completed: 'primary',
    cancelled: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap = {
    draft: '草稿',
    active: '执行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

// 获取发票状态类型
const getInvoiceStatusType = (status: string) => {
  const statusMap = {
    draft: 'info',
    sent: 'warning',
    paid: 'success',
    overdue: 'danger',
    cancelled: 'primary'
  }
  return statusMap[status] || 'info'
}

// 获取发票状态文本
const getInvoiceStatusText = (status: string) => {
  const statusMap = {
    draft: '草稿',
    sent: '已开票',
    paid: '已付款',
    overdue: '逾期',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

// 获取收款状态类型
const getPaymentStatusType = (status: string) => {
  const statusMap = {
    pending: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取收款状态文本
const getPaymentStatusText = (status: string) => {
  const statusMap = {
    pending: '待处理',
    completed: '已完成',
    failed: '失败'
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

// 计算发票已收款金额
const getInvoicePaidAmount = (invoice: any) => {
  if (!invoice.payments || !Array.isArray(invoice.payments) || invoice.payments.length === 0) {
    return 0
  }
  return invoice.payments
    .filter((payment: any) => payment.status === 'completed')
    .reduce((sum: number, payment: any) => sum + safeNumber(payment.amount), 0)
}

// 获取合同详情
const fetchContract = async () => {
  try {
    loading.value = true
    const response = await contractApi.getContractById(contractId.value)
    
    if (response.success && response.data) {
      contract.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch contract:', error)
    ElMessage.error('获取合同信息失败')
  } finally {
    loading.value = false
  }
}

// 编辑合同
const editContract = () => {
  router.push(`/contracts/${contractId.value}/edit`)
}

// 跳转到开票页面
const goToCreateInvoice = () => {
  router.push(`/invoices/create?contractId=${contractId.value}`)
}

// 跳转到收款页面
const goToCreatePayment = (invoiceId: number) => {
  router.push(`/payments/create?invoiceId=${invoiceId}`)
}

// 跳转到发票查看页面
const goToViewInvoice = (invoiceId: number) => {
  router.push(`/invoices/${invoiceId}`)
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 获取附件列表
const fetchAttachments = async () => {
  try {
    attachmentsLoading.value = true
    const response = await attachmentApi.getContractAttachments(contractId.value)

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
    const response = await attachmentApi.deleteContractAttachment(
      contractId.value,
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
  fetchContract()
  fetchAttachments()
})
</script>

<style scoped>
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-card-blue {
  background-color: #ecf5ff;
  border-color: #b3d8ff;
}

.stat-card-green {
  background-color: #f0f9ff;
  border-color: #95de64;
}

.stat-card-purple {
  background-color: #f4f1ff;
  border-color: #c7b3ff;
}

.stat-card-orange {
  background-color: #fff7e6;
  border-color: #ffd591;
}

.stat-card-red {
  background-color: #fff2f0;
  border-color: #ffb3b3;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  line-height: 1.2;
}

.stat-card-blue .stat-value {
  color: #409eff;
}

.stat-card-green .stat-value {
  color: #67c23a;
}

.stat-card-purple .stat-value {
  color: #722ed1;
}

.stat-card-orange .stat-value {
  color: #e6a23c;
}

.stat-card-red .stat-value {
  color: #f56c6c;
}

.stat-action {
  margin-top: 12px;
}

.action-button {
  width: 100%;
}

@media (max-width: 768px) {
  .stats-container {
    grid-template-columns: 1fr;
  }
}

/* 收款记录样式 */
.payment-item {
  margin-bottom: 8px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-amount {
  display: flex;
  flex-direction: column;
}

.amount-text {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.date-text {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.payment-tags {
  display: flex;
  gap: 8px;
  align-items: center;
}

.reference-number {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.payment-summary {
  font-size: 14px;
  color: #606266;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #e4e7ed;
}

/* 发票编号链接样式 */
.invoice-link {
  font-weight: 500;
  cursor: pointer;
}

.invoice-link:hover {
  text-decoration: underline;
}
</style>
