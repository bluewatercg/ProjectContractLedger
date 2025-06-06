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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { contractApi } from '@/api'
import type { Contract } from '@/api/types'

const router = useRouter()
const route = useRoute()

// 状态
const loading = ref(false)
const contract = ref<Contract>()

// 计算属性
const contractId = computed(() => Number(route.params.id))

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
    draft: '',
    active: 'success',
    completed: 'info',
    cancelled: 'danger'
  }
  return statusMap[status] || ''
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

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 组件挂载时获取数据
onMounted(() => {
  fetchContract()
})
</script>
