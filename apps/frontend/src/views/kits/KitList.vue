<template>
  <div class="kit-list-container">
    <div class="page-header">
      <h2>套账管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon> 新建套账
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="套账名称">
          <el-input v-model="searchForm.name" placeholder="请输入套账名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 150px">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table :data="filteredData" v-loading="loading" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="套账名称" min-width="150" />
        <el-table-column prop="code" label="套账编码" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="handleManageUsers(row)">用户授权</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新建/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑套账' : '新建套账'" width="500">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="套账名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入套账名称" />
        </el-form-item>
        <el-form-item label="套账编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入套账编码（唯一）" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态" v-if="isEdit">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 用户授权对话框 -->
    <el-dialog v-model="userDialogVisible" title="用户授权" width="600">
      <div class="user-auth-container">
        <p class="kit-info">当前套账: <strong>{{ selectedKit?.name }}</strong></p>
        
        <el-transfer
          v-model="selectedUserIds"
          :data="allUsers"
          :titles="['未授权用户', '已授权用户']"
          :props="{ key: 'id', label: 'display_name' }"
          filterable
          filter-placeholder="搜索用户"
        />
      </div>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveUserAuth" :loading="authLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getAllKits, createKit, updateKit, deleteKit, getUserKits, assignUserToKit, removeUserFromKit } from '@/api/kit'
import { getUserList } from '@/api/user'
import type { Kit } from '@/api/kit'
import { useAuthStore } from '@/stores/auth'
import { useKitStore } from '@/stores/kit'

const authStore = useAuthStore()
const kitStore = useKitStore()

// 搜索表单
const searchForm = reactive({
  name: '',
  status: ''
})

// 表格数据
const loading = ref(false)
const tableData = ref<Kit[]>([])

// 过滤后的数据
const filteredData = computed(() => {
  return tableData.value.filter(kit => {
    const nameMatch = !searchForm.name || kit.name.includes(searchForm.name)
    const statusMatch = !searchForm.status || kit.status === searchForm.status
    return nameMatch && statusMatch
  })
})

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const submitLoading = ref(false)

const form = reactive({
  id: 0,
  name: '',
  code: '',
  description: '',
  status: 'active'
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入套账名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入套账编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '编码只能包含字母、数字、下划线和横线', trigger: 'blur' }
  ]
}

// 用户授权对话框
const userDialogVisible = ref(false)
const selectedKit = ref<Kit | null>(null)
const selectedUserIds = ref<number[]>([])
const allUsers = ref<{ id: number; display_name: string }[]>([])
const authLoading = ref(false)

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const kits = await getAllKits()
    tableData.value = kits || []
  } catch (error) {
    console.error('Failed to load kit list:', error)
    ElMessage.error('获取套账列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  // 过滤由 computed 自动处理
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.status = ''
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// 新建
const handleCreate = () => {
  isEdit.value = false
  form.id = 0
  form.name = ''
  form.code = ''
  form.description = ''
  form.status = 'active'
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: Kit) => {
  isEdit.value = true
  form.id = row.id
  form.name = row.name
  form.code = row.code
  form.description = row.description || ''
  form.status = row.status
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      if (isEdit.value) {
        await updateKit(form.id, {
          name: form.name,
          description: form.description,
          status: form.status
        })
        ElMessage.success('更新成功')
      } else {
        await createKit({
          name: form.name,
          code: form.code,
          description: form.description
        })
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      loadData()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitLoading.value = false
    }
  })
}

// 删除
const handleDelete = async (row: Kit) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除套账 "${row.name}" 吗？删除后该套账下的数据将无法访问！`,
      '警告',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    
    await deleteKit(row.id)
    ElMessage.success('删除成功')
    loadData()
    
    // 刷新当前用户的套账列表
    if (authStore.user?.id) {
      await kitStore.refreshKits(authStore.user.id)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 用户授权管理
const handleManageUsers = async (row: Kit) => {
  selectedKit.value = row
  authLoading.value = true
  
  try {
    // 获取所有用户
    const userResult = await getUserList({ page: 1, pageSize: 1000 })
    allUsers.value = (userResult.list || []).map((u: any) => ({
      id: u.id,
      display_name: `${u.full_name || u.username} (${u.username})`
    }))
    
    // 获取已授权的用户（通过查询每个用户的套装）
    const authorizedIds: number[] = []
    for (const user of allUsers.value) {
      try {
        const kits = await getUserKits(user.id)
        if (kits.some((k: Kit) => k.id === row.id)) {
          authorizedIds.push(user.id)
        }
      } catch {
        // 忽略错误
      }
    }
    selectedUserIds.value = authorizedIds
    
    userDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    authLoading.value = false
  }
}

// 保存用户授权
const handleSaveUserAuth = async () => {
  if (!selectedKit.value) return
  
  authLoading.value = true
  try {
    const kitId = selectedKit.value.id
    
    // 获取当前已授权的用户
    const currentAuthorized: number[] = []
    for (const user of allUsers.value) {
      try {
        const kits = await getUserKits(user.id)
        if (kits.some((k: Kit) => k.id === kitId)) {
          currentAuthorized.push(user.id)
        }
      } catch {
        // 忽略错误
      }
    }
    
    // 新增授权
    const toAdd = selectedUserIds.value.filter(id => !currentAuthorized.includes(id))
    for (const userId of toAdd) {
      await assignUserToKit(userId, kitId, false)
    }
    
    // 移除授权
    const toRemove = currentAuthorized.filter(id => !selectedUserIds.value.includes(id))
    for (const userId of toRemove) {
      await removeUserFromKit(userId, kitId)
    }
    
    // 刷新当前用户的套账列表（以便右上角下拉框更新）
    if (authStore.user?.id) {
      await kitStore.refreshKits(authStore.user.id)
    }
    
    ElMessage.success('授权保存成功')
    userDialogVisible.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '保存授权失败')
  } finally {
    authLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.kit-list-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.search-bar {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.table-container {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.user-auth-container {
  padding: 0 20px;
}

.kit-info {
  margin-bottom: 20px;
  font-size: 14px;
  color: #606266;
}

.kit-info strong {
  color: #409EFF;
}
</style>
