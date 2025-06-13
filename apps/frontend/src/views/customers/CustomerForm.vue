<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑客户' : '新建客户' }}</h2>
    </div>
    
    <div class="form-container">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        v-loading="loading"
      >
        <el-form-item label="客户名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入客户名称" />
        </el-form-item>
        
        <el-form-item label="联系人" prop="contact_person">
          <el-input v-model="form.contact_person" placeholder="请输入联系人姓名" />
        </el-form-item>
        
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        
        <el-form-item label="地址" prop="address">
          <el-input
            v-model="form.address"
            type="textarea"
            :rows="3"
            placeholder="请输入详细地址"
          />
        </el-form-item>
        
        <el-form-item label="税号" prop="tax_number">
          <el-input v-model="form.tax_number" placeholder="请输入税务登记号" />
        </el-form-item>
        
        <el-form-item label="银行账户" prop="bank_account">
          <el-input v-model="form.bank_account" placeholder="请输入银行账户" />
        </el-form-item>
        
        <el-form-item label="开户银行" prop="bank_name">
          <el-input v-model="form.bank_name" placeholder="请输入开户银行" />
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
import { customerApi } from '@/api'
import type { CreateCustomerDto, UpdateCustomerDto } from '@/api/types'

const router = useRouter()
const route = useRoute()

// 表单引用
const formRef = ref<FormInstance>()

// 状态
const loading = ref(false)
const submitting = ref(false)

// 计算属性
const isEdit = computed(() => !!route.params.id)
const customerId = computed(() => Number(route.params.id))

// 表单数据
const form = reactive<CreateCustomerDto>({
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  tax_number: '',
  bank_account: '',
  bank_name: '',
  notes: ''
})

// 验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入客户名称', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 获取客户详情（编辑模式）
const fetchCustomer = async () => {
  if (!isEdit.value) return
  
  try {
    loading.value = true
    const response = await customerApi.getCustomerById(customerId.value)
    
    if (response.success && response.data) {
      Object.assign(form, response.data)
    }
  } catch (error) {
    console.error('Failed to fetch customer:', error)
    ElMessage.error('获取客户信息失败')
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
      response = await customerApi.updateCustomer(customerId.value, form as UpdateCustomerDto)
    } else {
      response = await customerApi.createCustomer(form)
    }
    
    if (response.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      router.push('/customers')
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
    fetchCustomer()
  }
})
</script>
