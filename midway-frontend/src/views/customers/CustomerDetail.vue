<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">客户详情</h2>
      <div>
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" @click="editCustomer">编辑</el-button>
      </div>
    </div>
    
    <div v-loading="loading">
      <el-descriptions v-if="customer" :column="2" border>
        <el-descriptions-item label="客户名称">{{ customer.name }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ customer.contact_person || '-' }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ customer.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ customer.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ customer.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="税号">{{ customer.tax_number || '-' }}</el-descriptions-item>
        <el-descriptions-item label="银行账户">{{ customer.bank_account || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开户银行" :span="2">{{ customer.bank_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="customer.status === 'active' ? 'success' : 'danger'">
            {{ customer.status === 'active' ? '活跃' : '停用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(customer.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ customer.notes || '-' }}</el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { customerApi } from '@/api'
import type { Customer } from '@/api/types'

const router = useRouter()
const route = useRoute()

// 状态
const loading = ref(false)
const customer = ref<Customer>()

// 计算属性
const customerId = computed(() => Number(route.params.id))

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取客户详情
const fetchCustomer = async () => {
  try {
    loading.value = true
    const response = await customerApi.getCustomerById(customerId.value)
    
    if (response.success && response.data) {
      customer.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch customer:', error)
    ElMessage.error('获取客户信息失败')
  } finally {
    loading.value = false
  }
}

// 编辑客户
const editCustomer = () => {
  router.push(`/customers/${customerId.value}/edit`)
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 组件挂载时获取数据
onMounted(() => {
  fetchCustomer()
})
</script>
