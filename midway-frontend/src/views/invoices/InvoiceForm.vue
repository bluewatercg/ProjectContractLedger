<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑发票' : '新建发票' }}</h2>
    </div>
    
    <div class="form-container">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        v-loading="loading"
      >
        <el-form-item label="合同" prop="contract_id">
          <ContractSelect
            v-model="form.contract_id"
            placeholder="请选择合同（支持搜索）"
            @change="handleContractChange"
          />
        </el-form-item>
        
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
        
        <el-form-item label="开票日期" prop="issue_date">
          <el-date-picker
            v-model="form.issue_date"
            type="date"
            placeholder="请选择开票日期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="发票描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入发票描述"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { invoiceApi } from '@/api'
import type { CreateInvoiceDto, UpdateInvoiceDto, Contract } from '@/api/types'
import ContractSelect from '@/components/ContractSelect.vue'

const router = useRouter()
const route = useRoute()

// 表单引用
const formRef = ref<FormInstance>()

// 状态
const loading = ref(false)
const submitting = ref(false)

// 计算属性
const isEdit = computed(() => !!route.params.id)
const invoiceId = computed(() => Number(route.params.id))

// 表单数据
const form = reactive<CreateInvoiceDto>({
  contract_id: 0,
  amount: 0,
  tax_rate: 0,
  issue_date: '',
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

// 处理合同选择变化
const handleContractChange = (contractId: number | null, contract: any) => {
  form.contract_id = contractId || 0
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
        issue_date: parseDate(invoiceData.issue_date)
      })
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
      issue_date: formatDate(form.issue_date)
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

// 组件挂载时获取数据
onMounted(() => {
  if (isEdit.value) {
    fetchInvoice()
  }
})
</script>
