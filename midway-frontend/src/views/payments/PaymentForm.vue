<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑支付' : '新建支付' }}</h2>
    </div>
    
    <div class="form-container">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        v-loading="loading"
      >
        <el-form-item label="发票" prop="invoice_id">
          <InvoiceSelect
            v-model="form.invoice_id"
            placeholder="请选择发票（支持搜索）"
            @change="handleInvoiceChange"
          />
        </el-form-item>
        
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { paymentApi } from '@/api'
import type { CreatePaymentDto, UpdatePaymentDto, Invoice } from '@/api/types'
import InvoiceSelect from '@/components/InvoiceSelect.vue'

const router = useRouter()
const route = useRoute()

// 表单引用
const formRef = ref<FormInstance>()

// 状态
const loading = ref(false)
const submitting = ref(false)

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

// 处理发票选择变化
const handleInvoiceChange = (invoiceId: number | null, invoice: any) => {
  form.invoice_id = invoiceId || 0
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
    const response = await paymentApi.getPaymentById(paymentId.value)

    if (response.success && response.data) {
      const paymentData = response.data

      // 处理日期字段，确保正确显示
      Object.assign(form, {
        ...paymentData,
        payment_date: parseDate(paymentData.payment_date)
      })
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
      response = await paymentApi.updatePayment(paymentId.value, submitData as UpdatePaymentDto)
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
  }
})
</script>
