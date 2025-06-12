<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">合同管理</h2>
      <el-button type="primary" @click="$router.push('/contracts/create')">
        <el-icon><Plus /></el-icon>
        新建合同
      </el-button>
    </div>
    
    <div class="table-container">
      <div class="table-toolbar">
        <div class="table-search">
          <CustomerSelect
            v-model="customerFilter"
            placeholder="选择客户筛选（支持搜索）"
            width="250px"
            @change="handleCustomerFilter"
          />
          <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 120px" @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="执行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </div>
      </div>
      
      <el-table
        v-loading="loading"
        :data="contracts"
        style="width: 100%"
      >
        <el-table-column prop="contract_number" label="合同编号" width="150" />
        <el-table-column prop="title" label="合同标题" />
        <el-table-column prop="customer.name" label="客户名称" />
        <el-table-column prop="total_amount" label="合同金额" width="120">
          <template #default="{ row }">
            ¥{{ formatCurrency(row.total_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="120" />
        <el-table-column prop="end_date" label="结束日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewContract(row.id)">查看</el-button>
            <el-button size="small" type="primary" @click="editContract(row.id)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteContract(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { contractApi } from '@/api'
import type { Contract, Customer } from '@/api/types'
import CustomerSelect from '@/components/CustomerSelect.vue'

const router = useRouter()

// 状态
const loading = ref(false)
const contracts = ref<Contract[]>([])
const customerFilter = ref<number | null>(null)
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount)
}

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap = {
    draft: 'info',
    active: 'success',
    completed: 'primary',
    cancelled: 'danger'
  }
  return statusMap[status] || 'info'
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

// 处理客户筛选变化
const handleCustomerFilter = (customerId: number | null, customer: Customer | null) => {
  customerFilter.value = customerId
  currentPage.value = 1
  fetchContracts()
}

// 获取合同列表
const fetchContracts = async () => {
  try {
    loading.value = true
    const response = await contractApi.getContracts({
      page: currentPage.value,
      limit: pageSize.value,
      customerId: customerFilter.value || undefined,
      status: statusFilter.value
    })

    if (response.success && response.data) {
      contracts.value = response.data.items
      total.value = response.data.total
    }
  } catch (error) {
    console.error('Failed to fetch contracts:', error)
  } finally {
    loading.value = false
  }
}

// 筛选处理
const handleFilter = () => {
  currentPage.value = 1
  fetchContracts()
}

// 分页处理
const handleSizeChange = () => {
  currentPage.value = 1
  fetchContracts()
}

const handleCurrentChange = () => {
  fetchContracts()
}

// 查看合同
const viewContract = (id: number) => {
  router.push(`/contracts/${id}`)
}

// 编辑合同
const editContract = (id: number) => {
  router.push(`/contracts/${id}/edit`)
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
      fetchContracts()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete contract:', error)
    }
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchContracts()
})
</script>

<style scoped>
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
