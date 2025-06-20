<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑合同' : '新建合同' }}</h2>
    </div>
    
    <div class="form-container">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        v-loading="loading"
      >
        <el-form-item label="客户" prop="customer_id">
          <CustomerSelect
            v-model="form.customer_id"
            placeholder="请选择客户（支持搜索）"
            @change="handleCustomerChange"
          />
        </el-form-item>
        
        <el-form-item label="合同标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入合同标题" />
        </el-form-item>
        
        <el-form-item label="合同描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入合同描述"
          />
        </el-form-item>
        
        <el-form-item label="合同金额" prop="total_amount">
          <el-input-number
            v-model="form.total_amount"
            :min="0"
            :precision="2"
            style="width: 100%"
            placeholder="请输入合同金额"
          />
        </el-form-item>
        
        <el-form-item label="开始日期" prop="start_date">
          <el-date-picker
            v-model="form.start_date"
            type="date"
            placeholder="请选择开始日期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="结束日期" prop="end_date">
          <el-date-picker
            v-model="form.end_date"
            type="date"
            placeholder="请选择结束日期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="合同条款" prop="terms">
          <el-input
            v-model="form.terms"
            type="textarea"
            :rows="6"
            placeholder="请输入合同条款"
          />
        </el-form-item>
        
        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="4"
            placeholder="请输入备注信息"
          />
        </el-form-item>
        
        <div class="form-actions">
          <el-button @click="goBack">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ submitting ? '保存中...' : '保存' }}
          </el-button>
        </div>
      </el-form>

      <!-- 编辑模式下显示发票和收款信息 -->
      <div v-if="isEdit && contractData && contractData.invoices && contractData.invoices.length > 0" class="mt-8">
        <el-divider content-position="left">
          <h3 class="text-lg font-semibold">关联发票及收款情况</h3>
        </el-divider>

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
        <el-table :data="contractData?.invoices || []" border style="width: 100%">
          <el-table-column prop="invoice_number" label="发票编号" width="150">
            <template #default="scope">
              <el-link
                type="primary"
                @click="goToEditInvoice(scope.row.id)"
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
              {{ formatDisplayDate(scope.row.issue_date) }}
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
              <div v-if="scope.row.payments && scope.row.payments.length > 0">
                <div v-for="payment in scope.row.payments" :key="payment.id" class="payment-item">
                  <div class="payment-header">
                    <div class="payment-amount">
                      <span class="amount-text">¥{{ formatCurrency(payment.amount) }}</span>
                      <span class="date-text">{{ formatDisplayDate(payment.payment_date) }}</span>
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
                <div class="payment-summary">
                  已收: ¥{{ formatCurrency(getInvoicePaidAmount(scope.row)) }} /
                  未收: ¥{{ formatCurrency(scope.row.total_amount - getInvoicePaidAmount(scope.row)) }}
                </div>
              </div>
              <div v-else class="text-gray-500 text-sm">暂无收款记录</div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 无发票时的提示 -->
      <div v-else-if="isEdit && contractData && (!contractData.invoices || contractData.invoices.length === 0)" class="mt-8">
        <el-divider content-position="left">
          <h3 class="text-lg font-semibold">关联发票及收款情况</h3>
        </el-divider>
        <div class="text-center py-8 text-gray-500">
          <p>该合同暂无关联发票</p>
        </div>
      </div>

      <!-- 合同附件（仅编辑模式显示） -->
      <div v-if="isEdit && contractData" class="mt-8">
        <el-divider content-position="left">
          <h3 class="text-lg font-semibold">合同附件</h3>
        </el-divider>

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
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { contractApi } from '@/api'
import { attachmentApi } from '@/api/attachment'
import type { CreateContractDto, UpdateContractDto, Customer } from '@/api/types'
import type { Attachment } from '@/api/attachment'
import CustomerSelect from '@/components/CustomerSelect.vue'
import FileUpload from '@/components/FileUpload.vue'
import AttachmentList from '@/components/AttachmentList.vue'

const router = useRouter()
const route = useRoute()

// 表单引用
const formRef = ref<FormInstance>()

// 状态
const loading = ref(false)
const submitting = ref(false)
const contractData = ref<any>(null)
const attachments = ref<Attachment[]>([])
const attachmentsLoading = ref(false)

// 计算属性
const isEdit = computed(() => !!route.params.id)
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
  if (!contractData.value?.invoices || !Array.isArray(contractData.value.invoices)) {
    return {
      totalCount: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      uninvoicedAmount: contractData.value ? safeNumber(contractData.value.total_amount) : 0
    }
  }

  const invoices = contractData.value.invoices
  const contractAmount = safeNumber(contractData.value.total_amount)
  const totalCount = invoices.length
  const totalAmount = invoices.reduce((sum: number, invoice: any) => sum + safeNumber(invoice.total_amount), 0)
  const paidAmount = invoices.reduce((sum: number, invoice: any) => {
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

// 表单数据
const form = reactive<CreateContractDto>({
  customer_id: 0,
  title: '',
  description: '',
  total_amount: 0,
  start_date: '',
  end_date: '',
  terms: '',
  notes: ''
})

// 验证规则
const rules: FormRules = {
  customer_id: [
    { required: true, message: '请选择客户', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入合同标题', trigger: 'blur' }
  ],
  total_amount: [
    { required: true, message: '请输入合同金额', trigger: 'blur' }
  ],
  start_date: [
    { required: true, message: '请选择开始日期', trigger: 'change' }
  ],
  end_date: [
    { required: true, message: '请选择结束日期', trigger: 'change' }
  ]
}

// 处理客户选择变化
const handleCustomerChange = (customerId: number | null, customer: Customer | null) => {
  form.customer_id = customerId || 0
  console.log('Selected customer:', customer)
}

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount)
}

// 格式化显示日期
const formatDisplayDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
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

// 解析日期字符串为 Date 对象，处理时区问题
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null

  // 如果是 YYYY-MM-DD HH:mm:ss 格式，直接创建 Date 对象
  // 如果是 ISO 格式，需要转换为本地时间
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null

  return date
}

// 获取合同详情（编辑模式）
const fetchContract = async () => {
  if (!isEdit.value) return

  try {
    loading.value = true
    const response = await contractApi.getContractById(contractId.value)

    if (response.success && response.data) {
      const contract = response.data

      // 保存完整的合同数据用于显示发票信息
      contractData.value = contract

      // 处理日期字段，确保正确显示
      Object.assign(form, {
        ...contract,
        start_date: parseDate(contract.start_date),
        end_date: parseDate(contract.end_date)
      })
    }
  } catch (error) {
    console.error('Failed to fetch contract:', error)
    ElMessage.error('获取合同信息失败')
  } finally {
    loading.value = false
  }
}

// 格式化日期为 yyyy-MM-dd 格式
const formatDate = (date: Date | string | null): string => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  // 获取本地时间的年月日，格式化为 yyyy-MM-dd
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    // 格式化日期字段
    const submitData = {
      ...form,
      start_date: formatDate(form.start_date),
      end_date: formatDate(form.end_date)
    }

    let response
    if (isEdit.value) {
      response = await contractApi.updateContract(contractId.value, submitData as UpdateContractDto)
    } else {
      response = await contractApi.createContract(submitData)
    }

    if (response.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      router.push('/contracts')
    }
  } catch (error) {
    console.error('Failed to submit form:', error)
  } finally {
    submitting.value = false
  }
}

// 跳转到发票编辑页面
const goToEditInvoice = (invoiceId: number) => {
  router.push(`/invoices/${invoiceId}/edit`)
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 获取附件列表
const fetchAttachments = async () => {
  if (!isEdit.value) return

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
onMounted(async () => {
  // 如果是编辑模式，获取合同详情
  if (isEdit.value) {
    await fetchContract()
    await fetchAttachments()
  }
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
