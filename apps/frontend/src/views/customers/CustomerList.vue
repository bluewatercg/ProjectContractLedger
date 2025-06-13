<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">客户管理</h2>
      <el-button type="primary" @click="$router.push('/customers/create')">
        <el-icon><Plus /></el-icon>
        新建客户
      </el-button>
    </div>
    
    <div class="table-container">
      <div class="table-toolbar">
        <div class="table-search">
          <el-input
            v-model="searchQuery"
            placeholder="搜索客户名称、联系人或电话"
            style="width: 300px"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 120px" @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="活跃" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </div>
      </div>
      
      <el-table
        v-loading="loading"
        :data="customers"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="客户名称" />
        <el-table-column prop="contact_person" label="联系人" />
        <el-table-column prop="phone" label="电话" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '活跃' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewCustomer(row.id)">查看</el-button>
            <el-button size="small" type="primary" @click="editCustomer(row.id)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteCustomer(row.id)">删除</el-button>
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
import { customerApi } from '@/api'
import type { Customer } from '@/api/types'

const router = useRouter()

// 状态
const loading = ref(false)
const customers = ref<Customer[]>([])
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 获取客户列表
const fetchCustomers = async () => {
  try {
    loading.value = true
    const response = await customerApi.getCustomers({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value,
      status: statusFilter.value
    })
    
    if (response.success && response.data) {
      customers.value = response.data.items
      total.value = response.data.total
    }
  } catch (error) {
    console.error('Failed to fetch customers:', error)
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchCustomers()
}

// 筛选处理
const handleFilter = () => {
  currentPage.value = 1
  fetchCustomers()
}

// 分页处理
const handleSizeChange = () => {
  currentPage.value = 1
  fetchCustomers()
}

const handleCurrentChange = () => {
  fetchCustomers()
}

// 查看客户
const viewCustomer = (id: number) => {
  router.push(`/customers/${id}`)
}

// 编辑客户
const editCustomer = (id: number) => {
  router.push(`/customers/${id}/edit`)
}

// 删除客户
const deleteCustomer = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个客户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await customerApi.deleteCustomer(id)
    if (response.success) {
      ElMessage.success('删除成功')
      fetchCustomers()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete customer:', error)
    }
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchCustomers()
})
</script>

<style scoped>
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
