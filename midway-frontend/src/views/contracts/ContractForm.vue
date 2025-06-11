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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { contractApi } from '@/api'
import type { CreateContractDto, UpdateContractDto, Customer } from '@/api/types'
import CustomerSelect from '@/components/CustomerSelect.vue'

const router = useRouter()
const route = useRoute()

// 表单引用
const formRef = ref<FormInstance>()

// 状态
const loading = ref(false)
const submitting = ref(false)

// 计算属性
const isEdit = computed(() => !!route.params.id)
const contractId = computed(() => Number(route.params.id))

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
      const contractData = response.data

      // 处理日期字段，确保正确显示
      Object.assign(form, {
        ...contractData,
        start_date: parseDate(contractData.start_date),
        end_date: parseDate(contractData.end_date)
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

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 组件挂载时获取数据
onMounted(async () => {
  // 如果是编辑模式，获取合同详情
  if (isEdit.value) {
    await fetchContract()
  }
})
</script>
