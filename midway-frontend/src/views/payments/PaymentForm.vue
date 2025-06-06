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
          <el-select v-model="form.invoice_id" placeholder="请选择发票" style="width: 100%">
            <!-- 这里应该动态加载发票列表 -->
            <el-option label="发票1" value="1" />
            <el-option label="发票2" value="2" />
          </el-select>
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
import type { CreatePaymentDto, UpdatePaymentDto } from '@/api/types'

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

// 获取支付记录详情（编辑模式）
const fetchPayment = async () => {
  if (!isEdit.value) return
  
  try {
    loading.value = true
    const response = await paymentApi.getPaymentById(paymentId.value)
    
    if (response.success && response.data) {
      Object.assign(form, response.data)
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
    
    let response
    if (isEdit.value) {
      response = await paymentApi.updatePayment(paymentId.value, form as UpdatePaymentDto)
    } else {
      response = await paymentApi.createPayment(form)
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
