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
      
      <div class="table-infinite-container" v-infinite-scroll="loadMore" :infinite-scroll-disabled="disabled">
        <el-table
          v-loading="loading && currentPage === 1"
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
      </div>
      
      <div class="load-more-status" v-if="customers.length > 0">
        <p v-if="loading">加载中...</p>
        <p v-if="noMore">没有更多数据了</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
const pageSize = ref(20)
const total = ref(0)
const noMore = ref(false)

const disabled = computed(() => loading.value || noMore.value)

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 获取客户列表
const fetchCustomers = async (append = false) => {
  try {
    if (!append) {
      currentPage.value = 1
      customers.value = []
      noMore.value = false
    }
    
    loading.value = true
    const response = await customerApi.getCustomers({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value,
      status: statusFilter.value
    })
    
    if (response.success && response.data) {
      const newItems = response.data.items || []
      const totalCount = response.data.total
      
      if (append) {
        customers.value = [...customers.value, ...newItems]
      } else {
        customers.value = newItems
      }
      
      total.value = totalCount
      if (customers.value.length >= totalCount || newItems.length < pageSize.value) {
        noMore.value = true
      }
    }
  } catch (error) {
    console.error('Failed to fetch customers:', error)
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  fetchCustomers(false)
}

// 筛选处理
const handleFilter = () => {
  fetchCustomers(false)
}

// 无限滚动加载更多
const loadMore = () => {
  if (disabled.value) return
  currentPage.value++
  fetchCustomers(true)
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
.table-infinite-container {
  overflow-y: auto;
  max-height: calc(100vh - 250px);
}

.load-more-status {
  text-align: center;
  padding: 20px 0;
  color: #909399;
  font-size: 14px;
}
</style>
