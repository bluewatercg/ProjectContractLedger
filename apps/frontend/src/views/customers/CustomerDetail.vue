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
          <el-tag :type="getStatusType">
            {{ getStatusLabel }}
          </el-tag>
          <span v-if="customer.last_contract_end_date" class="status-detail">
            最后合同到期日：{{ formatDate(customer.last_contract_end_date) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(customer.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ customer.notes || '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 合同历史 -->
      <div v-if="customer" class="contracts-section">
        <div class="section-header">
          <h3 class="section-title">合同历史</h3>
          <el-button type="primary" size="small" @click="createContract">
            <el-icon><Plus /></el-icon>
            新建合同
          </el-button>
        </div>

        <div class="history-stats">
          <div class="history-stat">
            <span>合同总数</span>
            <strong>{{ contractHistoryStats.total }}</strong>
          </div>
          <div class="history-stat">
            <span>续签链数量</span>
            <strong>{{ contractHistoryStats.chainCount }}</strong>
          </div>
          <div class="history-stat">
            <span>一次性合同</span>
            <strong>{{ contractHistoryStats.standaloneCount }}</strong>
          </div>
          <div class="history-stat">
            <span>执行中合同</span>
            <strong>{{ contractHistoryStats.activeCount }}</strong>
          </div>
          <div class="history-stat wide">
            <span>累计合同金额</span>
            <strong>¥{{ formatCurrency(contractHistoryStats.totalAmount) }}</strong>
          </div>
          <div class="history-stat wide">
            <span>最近到期合同</span>
            <strong>{{ contractHistoryStats.nearestEndLabel }}</strong>
          </div>
        </div>

        <CustomerContractGroups
          :contract-chains="customer.contractChains || []"
          :standalone-contracts="customer.standaloneContracts || []"
          @view="viewContract"
          @edit="editContract"
          @invoice="goToInvoice"
          @payment="goToPayment"
          @delete="deleteContract"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { customerApi, contractApi } from '@/api'
import { useKitStore } from '@/stores/kit'
import type { Customer } from '@/api/types'
import CustomerContractGroups from '@/components/CustomerContractGroups.vue'

const router = useRouter()
const route = useRoute()
const kitStore = useKitStore()

// 状态
const loading = ref(false)
const customer = ref<Customer>()

// 计算属性
const customerId = computed(() => Number(route.params.id))

const allContracts = computed(() => customer.value?.contracts || [])

const contractHistoryStats = computed(() => {
  const contracts = allContracts.value
  const totalAmount = contracts.reduce((sum, contract) => {
    return sum + Number(contract.total_amount || 0)
  }, 0)
  const activeCount = contracts.filter(contract => contract.status === 'active').length
  const sortedByEndDate = [...contracts]
    .filter(contract => contract.end_date)
    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
  const today = new Date()
  const nearestUpcoming =
    sortedByEndDate.find(contract => new Date(contract.end_date) >= today) ||
    sortedByEndDate[sortedByEndDate.length - 1]
  const nearestEndLabel = nearestUpcoming
    ? `${nearestUpcoming.contract_number}（${formatDateOnly(nearestUpcoming.end_date)}）`
    : '-'

  return {
    total: contracts.length,
    chainCount: customer.value?.contractChains?.length || 0,
    standaloneCount: customer.value?.standaloneContracts?.length || 0,
    activeCount,
    totalAmount,
    nearestEndLabel
  }
})

// 状态展示计算
const getStatusType = computed(() => {
  if (!customer.value) return 'info'
  if (customer.value.status === 'active') return 'success'
  if (customer.value.last_contract_end_date) {
    const end = new Date(customer.value.last_contract_end_date)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    return end >= oneYearAgo ? 'warning' : 'danger'
  }
  return 'info'
})

const getStatusLabel = computed(() => {
  if (!customer.value) return '-'
  if (customer.value.status === 'active') return '履约中'
  if (customer.value.last_contract_end_date) {
    const end = new Date(customer.value.last_contract_end_date)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    return end >= oneYearAgo ? '历史合作' : '停用'
  }
  return '未合作'
})

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatDateOnly = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(Number(amount || 0))
}

// 获取客户详情
const fetchCustomer = async () => {
  try {
    loading.value = true
    const response = await customerApi.getCustomerById(customerId.value, {
      viewAll: kitStore.viewAllKits,
    })
    
    if (response.success && response.data) {
      customer.value = response.data
    }
  } catch (error: any) {
    console.error('Failed to fetch customer:', error)
    if (error?.message?.includes('客户不存在')) {
      customer.value = undefined
      ElMessage.warning('当前套账下不存在该客户，已返回客户列表')
      router.replace('/customers')
      return
    }
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

// 新建合同
const createContract = () => {
  router.push(`/contracts/create?customerId=${customerId.value}`)
}

// 查看合同
const viewContract = (id: number) => {
  router.push(`/contracts/${id}`)
}

// 编辑合同
const editContract = (id: number) => {
  router.push(`/contracts/${id}/edit`)
}

// 去开票
const goToInvoice = (contractId: number) => {
  router.push(`/invoices/create?contractId=${contractId}`)
}

// 去收款
const goToPayment = (contractId: number) => {
  router.push(`/contracts/${contractId}`)
}

// 删除合同
const deleteContract = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个合同吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await contractApi.deleteContract(id, {
      viewAll: kitStore.viewAllKits,
    })
    if (response.success) {
      ElMessage.success('删除成功')
      fetchCustomer() // 重新获取客户信息以更新合同列表
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete contract:', error)
      ElMessage.error('删除合同失败')
    }
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchCustomer()
})
</script>

<style scoped>
.status-detail {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.contracts-section {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #e4e7ed;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.history-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 22px;
}

.history-stat {
  min-width: 0;
  padding: 14px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
}

.history-stat span {
  display: block;
  color: #606266;
  font-size: 13px;
  margin-bottom: 8px;
}

.history-stat strong {
  display: block;
  color: #303133;
  font-size: 20px;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.history-stat.wide {
  grid-column: span 2;
}

@media (min-width: 768px) and (max-width: 1199px) {
  .history-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .history-stats {
    grid-template-columns: 1fr;
  }

  .history-stat.wide {
    grid-column: auto;
  }
}
</style>
