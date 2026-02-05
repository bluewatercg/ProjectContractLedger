<template>
  <div class="page-container">
    <div class="invoice-form-container">
      <!-- 表单头部 -->
      <div class="form-header">
        <h2 class="form-title">{{ isEdit ? '编辑发票' : '新建发票' }}</h2>
        <p class="form-description">
          {{ isEdit ? '修改发票信息，确保所有必填项准确无误' : '创建新的发票记录，填写完整的发票信息' }}
        </p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        v-loading="loading"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <h3 class="section-title">
            <el-icon><Document /></el-icon>
            基本信息
          </h3>
          <div class="form-grid">
            <el-form-item label="客户" prop="customer_id" class="form-item-full">
              <CustomerSelect
                v-model="selectedCustomerId"
                placeholder="请选择客户（支持搜索）"
                :only-with-active-contracts="true"
                @change="handleCustomerChange"
              />
            </el-form-item>

            <el-form-item label="合同" prop="contract_id" class="form-item-full">
              <ContractSelect
                v-model="form.contract_id"
                :customer-id="selectedCustomerId"
                placeholder="请选择合同（支持搜索）"
                @change="handleContractChange"
              />
            </el-form-item>
          </div>
        </div>

        <!-- 金额信息 -->
        <div class="form-section">
          <h3 class="section-title">
            <el-icon><Money /></el-icon>
            金额信息
          </h3>
          <div class="form-grid">
            <el-form-item label="发票金额" prop="amount">
              <el-input-number
                v-model="form.amount"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="请输入发票金额"
                @change="calculateTotal"
              />
            </el-form-item>

            <el-form-item label="税率(%)" prop="tax_rate">
              <el-input-number
                v-model="form.tax_rate"
                :min="0"
                :max="100"
                :precision="2"
                style="width: 100%"
                placeholder="请输入税率"
                @change="calculateTotal"
              />
            </el-form-item>

            <el-form-item label="税额">
              <el-input-number
                :model-value="taxAmount"
                disabled
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="总金额">
              <el-input-number
                :model-value="totalAmount"
                disabled
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </div>
        </div>

        <!-- 日期信息 -->
        <div class="form-section">
          <h3 class="section-title">
            <el-icon><Calendar /></el-icon>
            日期信息
          </h3>
          <div class="form-grid">
            <el-form-item label="开票日期" prop="issue_date">
              <el-date-picker
                v-model="form.issue_date"
                type="date"
                placeholder="请选择开票日期"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="到期日期" prop="due_date">
              <el-date-picker
                v-model="form.due_date"
                type="date"
                placeholder="请选择到期日期"
                style="width: 100%"
              />
            </el-form-item>
          </div>
        </div>

        <!-- 描述与备注 -->
        <div class="form-section">
          <h3 class="section-title">
            <el-icon><Memo /></el-icon>
            描述与备注
          </h3>
          <div class="form-grid">
            <el-form-item label="发票描述" prop="description" class="form-item-full">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="4"
                placeholder="请输入发票描述（发票号等）"
              />
            </el-form-item>

            <el-form-item label="备注" prop="notes" class="form-item-full">
              <el-input
                v-model="form.notes"
                type="textarea"
                :rows="4"
                placeholder="请输入备注信息"
              />
            </el-form-item>
          </div>
        </div>

        <div class="form-actions">
          <el-button @click="goBack">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ submitting ? '保存中...' : '保存' }}
          </el-button>
        </div>
      </el-form>

      <!-- 发票附件（仅编辑模式显示） -->
      <div v-if="isEdit" class="mt-8">
        <el-divider content-position="left">
          <h3 class="text-lg font-semibold">发票附件</h3>
        </el-divider>

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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Document, Money, Calendar, Memo } from '@element-plus/icons-vue'
import { invoiceApi, contractApi } from '@/api'
import { attachmentApi } from '@/api/attachment'
import type { CreateInvoiceDto, UpdateInvoiceDto, Contract, Customer } from '@/api/types'
import type { Attachment } from '@/api/attachment'
import ContractSelect from '@/components/ContractSelect.vue'
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
const selectedCustomerId = ref<number | null>(null)
const attachments = ref<Attachment[]>([])
const attachmentsLoading = ref(false)

// 计算属性
const isEdit = computed(() => !!route.params.id)
const invoiceId = computed(() => Number(route.params.id))

// 表单数据
const form = reactive<UpdateInvoiceDto>({
  contract_id: 0,
  amount: 0,
  tax_rate: 0,
  issue_date: '',
  due_date: '',
  description: '',
  notes: ''
})

// 计算税额和总额
const taxAmount = computed(() => {
  return form.amount * (form.tax_rate || 0) / 100
})

const totalAmount = computed(() => {
  return form.amount + taxAmount.value
})

// 验证规则
const rules: FormRules = {
  contract_id: [
    { required: true, message: '请选择合同', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入发票金额', trigger: 'blur' }
  ],
  issue_date: [
    { required: true, message: '请选择开票日期', trigger: 'change' }
  ]
}

// 处理客户选择变化
const handleCustomerChange = (customerId: number | null, customer: Customer | null) => {
  selectedCustomerId.value = customerId
  // 当客户变化时，重置合同选择
  if (form.contract_id !== 0) {
    form.contract_id = 0
    ElMessage.info('已重置合同选择，请重新选择该客户下的合同')
  }
  console.log('Selected customer:', customer)
}

// 处理合同选择变化
const handleContractChange = (contractId: number | null, contract: Contract | null) => {
  form.contract_id = contractId || 0
  // 如果选择了合同，自动设置客户
  if (contract && contract.customer) {
    selectedCustomerId.value = contract.customer.id
  }
  console.log('Selected contract:', contract)
}

// 计算总额
const calculateTotal = () => {
  // 这个方法会触发计算属性的重新计算
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

// 解析日期字符串为 Date 对象，处理时区问题
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null

  // 如果是 YYYY-MM-DD HH:mm:ss 格式，直接创建 Date 对象
  // 如果是 ISO 格式，需要转换为本地时间
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null

  return date
}

// 获取发票详情（编辑模式）
const fetchInvoice = async () => {
  if (!isEdit.value) return

  try {
    loading.value = true
    const response = await invoiceApi.getInvoiceById(invoiceId.value)

    if (response.success && response.data) {
      const invoiceData = response.data

      // 处理日期字段，确保正确显示
      Object.assign(form, {
        ...invoiceData,
        issue_date: parseDate(invoiceData.issue_date),
        due_date: parseDate(invoiceData.due_date)
      })

      // 设置客户信息
      if (invoiceData.contract && invoiceData.contract.customer) {
        selectedCustomerId.value = invoiceData.contract.customer.id
      }
    }
  } catch (error) {
    console.error('Failed to fetch invoice:', error)
    ElMessage.error('获取发票信息失败')
  } finally {
    loading.value = false
  }
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
      issue_date: formatDate(form.issue_date),
      due_date: formatDate(form.due_date)
    }

    let response
    if (isEdit.value) {
      response = await invoiceApi.updateInvoice(invoiceId.value, submitData as UpdateInvoiceDto)
    } else {
      response = await invoiceApi.createInvoice(submitData)
    }

    if (response.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      router.push('/invoices')
    }
  } catch (error) {
    console.error('Failed to submit form:', error)
  } finally {
    submitting.value = false
  }
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
onMounted(async () => {
  if (isEdit.value) {
    await fetchInvoice()
    await fetchAttachments()
  } else {
    // 新建模式下，检查是否有预填的合同ID
    const contractId = route.query.contractId
    if (contractId) {
      const id = Number(contractId)
      form.contract_id = id
      
      // 获取合同详情以自动填充客户信息
      try {
        loading.value = true
        const response = await contractApi.getContractById(id)
        if (response.success && response.data) {
          const contract = response.data
          if (contract.customer) {
            selectedCustomerId.value = contract.customer.id
          }
        }
      } catch (error) {
        console.error('Failed to fetch contract details:', error)
      } finally {
        loading.value = false
      }
    }
  }
})
</script>

<style scoped>
/* 表单容器 */
.invoice-form-container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 表单头部 */
.form-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f5f7fa;
}

.form-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.form-description {
  font-size: 0.875rem;
  color: #909399;
  line-height: 1.5;
}

/* 表单分组 */
.form-section {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  transition: all 0.3s ease;
}

.form-section:hover {
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.section-title .el-icon {
  font-size: 20px;
  color: #409eff;
}

/* 表单网格 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.form-item-full {
  grid-column: 1 / -1;
}

/* Element Plus 增强 */
:deep(.el-form-item__label) {
  font-size: 0.875rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.1) inset;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.2) inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #409eff inset;
}

:deep(.el-textarea__inner) {
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  transition: all 0.2s ease;
}

:deep(.el-textarea__inner:focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  margin-top: 24px;
  border-top: 2px solid #f5f7fa;
}

.form-actions .el-button {
  min-width: 120px;
  height: 44px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-actions .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 响应式 */
@media (max-width: 768px) {
  .invoice-form-container {
    padding: 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions .el-button {
    width: 100%;
  }
}
</style>
