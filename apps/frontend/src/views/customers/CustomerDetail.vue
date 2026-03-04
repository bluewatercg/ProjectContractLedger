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

      <!-- 关联合同列表 -->
      <div v-if="customer" class="contracts-section">
        <div class="section-header">
          <h3 class="section-title">关联合同</h3>
          <el-button type="primary" size="small" @click="createContract">
            <el-icon><Plus /></el-icon>
            新建合同
          </el-button>
        </div>

        <div v-if="customer.contracts && customer.contracts.length > 0" class="contracts-grid">
          <ContractCard
            v-for="contract in customer.contracts"
            :key="contract.id"
            :contract="contract"
            @view="viewContract"
            @edit="editContract"
            @invoice="goToInvoice"
            @payment="goToPayment"
            @delete="deleteContract"
          />
        </div>

        <el-empty
          v-else
          description="该客户暂无关联合同"
          :image-size="150"
        >
          <el-button type="primary" @click="createContract">
            新建第一个合同
          </el-button>
        </el-empty>
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
import ContractCard from '@/components/ContractCard.vue'

const router = useRouter()
const route = useRoute()
const kitStore = useKitStore()

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
    const response = await customerApi.getCustomerById(customerId.value, {
      viewAll: kitStore.viewAllKits,
    })
    
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
    
    const response = await contractApi.deleteContract(id)
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

.contracts-grid {
  display: grid;
  gap: 12px;
  padding: 4px;
}

/* Desktop: 4 columns */
@media (min-width: 1200px) {
  .contracts-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Tablet: 3 columns */
@media (min-width: 768px) and (max-width: 1199px) {
  .contracts-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Mobile: 1 column */
@media (max-width: 767px) {
  .contracts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
