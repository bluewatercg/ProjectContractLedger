<template>
  <div class="page-container">
    <div class="payment-form-container">
      <!-- 表单头部 -->
      <div class="form-header">
        <h2 class="form-title">{{ isEdit ? '编辑支付' : '新建支付' }}</h2>
        <p class="form-description">
          {{ isEdit ? '修改支付信息，确保所有必填项准确无误' : '创建新的支付记录，填写完整的支付信息' }}
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
                :only-with-unpaid-invoices="true"
                @change="handleCustomerChange"
              />
            </el-form-item>

            <el-form-item label="发票" prop="invoice_id" class="form-item-full">
              <InvoiceSelect
                v-model="form.invoice_id"
                :customer-id="selectedCustomerId"
                placeholder="请选择发票（支持搜索）"
                @change="handleInvoiceChange"
              />
            </el-form-item>
          </div>
        </div>

        <!-- 支付信息 -->
        <div class="form-section">
          <h3 class="section-title">
            <el-icon><Money /></el-icon>
            支付信息
          </h3>
          <div class="form-grid">
            <el-form-item label="支付金额" prop="amount">
              <el-input-number
                v-model="form.amount"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="请输入支付金额"
              />
            </el-form-item>

            <el-form-item label="支付日期" prop="payment_date">
              <el-date-picker
                v-model="form.payment_date"
                type="date"
                placeholder="请选择支付日期"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="支付方式" prop="payment_method">
              <el-select v-model="form.payment_method" placeholder="请选择支付方式" style="width: 100%">
                <el-option label="现金" value="cash" />
                <el-option label="银行转账" value="bank_transfer" />
                <el-option label="支票" value="check" />
                <el-option label="信用卡" value="credit_card" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>

            <el-form-item label="参考号" prop="reference_number">
              <el-input v-model="form.reference_number" placeholder="请输入参考号或交易号" />
            </el-form-item>
          </div>
        </div>

        <!-- 备注信息 -->
        <div class="form-section">
          <h3 class="section-title">
            <el-icon><Memo /></el-icon>
            备注信息
          </h3>
          <div class="form-grid">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Document, Money, Memo } from '@element-plus/icons-vue'
import { paymentApi } from '@/api'
import { useKitStore } from '@/stores/kit'
import type { CreatePaymentDto, UpdatePaymentDto, Invoice, Customer } from '@/api/types'
import InvoiceSelect from '@/components/InvoiceSelect.vue'
import CustomerSelect from '@/components/CustomerSelect.vue'

const router = useRouter()
const route = useRoute()
const kitStore = useKitStore()

// 表单引用
const formRef = ref<FormInstance>()

// 状态
const loading = ref(false)
const submitting = ref(false)
const selectedCustomerId = ref<number | null>(null)

// 计算属性
const isEdit = computed(() => !!route.params.id)
const paymentId = computed(() => Number(route.params.id))

// 表单数据
const form = reactive<CreatePaymentDto>({
  invoice_id: 0,
  amount: 0,
  payment_date: '',
  payment_method: 'bank_transfer',
  reference_number: '',
  notes: ''
})

// 验证规则
const rules: FormRules = {
  invoice_id: [
    { required: true, message: '请选择发票', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入支付金额', trigger: 'blur' }
  ],
  payment_date: [
    { required: true, message: '请选择支付日期', trigger: 'change' }
  ],
  payment_method: [
    { required: true, message: '请选择支付方式', trigger: 'change' }
  ]
}

// 处理客户选择变化
const handleCustomerChange = (customerId: number | null, customer: Customer | null) => {
  selectedCustomerId.value = customerId
  // 当客户变化时，重置发票选择
  form.invoice_id = 0
  console.log('Selected customer:', customer)
}

// 处理发票选择变化
const handleInvoiceChange = (invoiceId: number | null, invoice: Invoice | null) => {
  form.invoice_id = invoiceId || 0
  // 如果选择了发票，自动设置客户
  if (invoice && invoice.contract && invoice.contract.customer) {
    selectedCustomerId.value = invoice.contract.customer.id
  }
  console.log('Selected invoice:', invoice)
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

// 获取支付记录详情（编辑模式）
const fetchPayment = async () => {
  if (!isEdit.value) return

  try {
    loading.value = true
    const response = await paymentApi.getPaymentById(paymentId.value, {
      viewAll: kitStore.viewAllKits,
    })

    if (response.success && response.data) {
      const paymentData = response.data

      // 处理日期字段，确保正确显示
      Object.assign(form, {
        ...paymentData,
        payment_date: parseDate(paymentData.payment_date)
      })

      // 设置客户信息
      if (paymentData.invoice && paymentData.invoice.contract && paymentData.invoice.contract.customer) {
        selectedCustomerId.value = paymentData.invoice.contract.customer.id
      }
    }
  } catch (error) {
    console.error('Failed to fetch payment:', error)
    ElMessage.error('获取支付记录失败')
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
      payment_date: formatDate(form.payment_date)
    }

    let response
    if (isEdit.value) {
      response = await paymentApi.updatePayment(
        paymentId.value,
        submitData as UpdatePaymentDto,
        { viewAll: kitStore.viewAllKits }
      )
    } else {
      response = await paymentApi.createPayment(submitData)
    }

    if (response.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      router.push('/payments')
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

// 组件挂载时获取数据
onMounted(() => {
  if (isEdit.value) {
    fetchPayment()
  } else {
    // 检查URL参数，预填充发票信息
    const invoiceId = route.query.invoiceId
    if (invoiceId) {
      form.invoice_id = Number(invoiceId)
    }
  }
})
</script>

<style scoped>
/* 表单容器 */
.payment-form-container {
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
  .payment-form-container {
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
