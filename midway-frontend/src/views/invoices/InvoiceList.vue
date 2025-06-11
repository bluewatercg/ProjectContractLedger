<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">发票管理</h2>
      <el-button type="primary" @click="$router.push('/invoices/create')">
        <el-icon><Plus /></el-icon>
        新建发票
      </el-button>
    </div>
    
    <div class="table-container">
      <div class="table-toolbar">
        <div class="table-search">
          <ContractSelect
            v-model="contractFilter"
            placeholder="选择合同筛选（支持搜索）"
            width="250px"
            @change="handleContractFilter"
          />
          <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 120px" @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="已发送" value="sent" />
            <el-option label="已支付" value="paid" />
            <el-option label="逾期" value="overdue" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </div>
      </div>
      
      <el-table
        v-loading="loading"
        :data="invoices"
        style="width: 100%"
      >
        <el-table-column prop="invoice_number" label="发票编号" width="150" />
        <el-table-column prop="contract.title" label="合同标题" />
        <el-table-column prop="contract.customer.name" label="客户名称" />
        <el-table-column prop="total_amount" label="发票金额" width="120">
          <template #default="{ row }">
            ¥{{ formatCurrency(row.total_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="issue_date" label="开票日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewInvoice(row.id)">查看</el-button>
            <el-button size="small" type="primary" @click="editInvoice(row.id)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteInvoice(row.id)">删除</el-button>
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
import { invoiceApi } from '@/api'
import type { Invoice, Contract } from '@/api/types'
import ContractSelect from '@/components/ContractSelect.vue'

const router = useRouter()

// 状态
const loading = ref(false)
const invoices = ref<Invoice[]>([])
const contractFilter = ref<number | null>(null)
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
    draft: '',
    sent: 'warning',
    paid: 'success',
    overdue: 'danger',
    cancelled: 'info'
  }
  return statusMap[status] || ''
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap = {
    draft: '草稿',
    sent: '已发送',
    paid: '已支付',
    overdue: '逾期',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

// 获取发票列表
const fetchInvoices = async () => {
  try {
    loading.value = true
    const response = await invoiceApi.getInvoices({
      page: currentPage.value,
      limit: pageSize.value,
      contractId: contractFilter.value || undefined,
      status: statusFilter.value
    })

    if (response.success && response.data) {
      invoices.value = response.data.items
      total.value = response.data.total
    }
  } catch (error) {
    console.error('Failed to fetch invoices:', error)
  } finally {
    loading.value = false
  }
}

// 合同筛选处理
const handleContractFilter = (contractId: number | null, contract: any) => {
  contractFilter.value = contractId
  currentPage.value = 1
  fetchInvoices()
}

// 筛选处理
const handleFilter = () => {
  currentPage.value = 1
  fetchInvoices()
}

// 分页处理
const handleSizeChange = () => {
  currentPage.value = 1
  fetchInvoices()
}

const handleCurrentChange = () => {
  fetchInvoices()
}

// 查看发票
const viewInvoice = (id: number) => {
  router.push(`/invoices/${id}`)
}

// 编辑发票
const editInvoice = (id: number) => {
  router.push(`/invoices/${id}/edit`)
}

// 删除发票
const deleteInvoice = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这张发票吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await invoiceApi.deleteInvoice(id)
    if (response.success) {
      ElMessage.success('删除成功')
      fetchInvoices()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete invoice:', error)
    }
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchInvoices()
})
</script>

<style scoped>
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
