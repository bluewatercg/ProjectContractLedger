<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">业务类型管理</h2>
      <el-button type="primary" @click="handleAddRoot">
        <el-icon><Plus /></el-icon>添加根分类
      </el-button>
    </div>

    <div class="tree-container" v-loading="loading">
      <el-empty v-if="!loading && treeData.length === 0" description="暂无业务类型，请添加根分类" />
      <el-tree
        v-else
        ref="treeRef"
        :data="treeData"
        node-key="id"
        :props="treeProps"
        draggable
        default-expand-all
        :allow-drag="allowDrag"
        :allow-drop="allowDrop"
        @node-drop="handleDrop"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <span class="tree-node-label">
              {{ data.name }}
              <el-tag v-if="data.status === 'disabled'" size="small" type="info" class="status-tag">
                已禁用
              </el-tag>
            </span>
            <span class="tree-node-actions">
              <el-button size="small" text type="primary" @click.stop="handleAddChild(data)">
                添加子分类
              </el-button>
              <el-button size="small" text type="primary" @click.stop="handleEdit(data)">
                编辑
              </el-button>
              <el-button
                size="small"
                text
                :type="data.status === 'active' ? 'warning' : 'success'"
                @click.stop="handleToggleStatus(data)"
              >
                {{ data.status === 'active' ? '禁用' : '启用' }}
              </el-button>
              <el-button size="small" text type="danger" @click.stop="handleDelete(data)">
                删除
              </el-button>
            </span>
          </div>
        </template>
      </el-tree>
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="400px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" maxlength="50" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { businessCategoryApi } from '@/api/business-category'
import type { BusinessCategory } from '@/api/types'
import type { FormInstance, FormRules } from 'element-plus'
import type Node from 'element-plus/es/components/tree/src/model/node'

// State
const treeRef = ref()
const formRef = ref<FormInstance>()
const treeData = ref<BusinessCategory[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const parentId = ref<number | null>(null)
const form = ref({ name: '' })
const submitting = ref(false)

// Tree props
const treeProps = {
  label: 'name',
  children: 'children'
}

// Form rules
const rules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

// Computed
const dialogTitle = computed(() => {
  if (editingId.value) {
    return '编辑业务类型'
  }
  return parentId.value ? '添加子分类' : '添加根分类'
})

// Methods
const fetchTree = async () => {
  loading.value = true
  try {
    const res = await businessCategoryApi.getTree()
    if (res.success) {
      treeData.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('获取业务类型列表失败')
  } finally {
    loading.value = false
  }
}

const handleAddRoot = () => {
  editingId.value = null
  parentId.value = null
  form.value = { name: '' }
  dialogVisible.value = true
}

const handleAddChild = (data: BusinessCategory) => {
  editingId.value = null
  parentId.value = data.id
  form.value = { name: '' }
  dialogVisible.value = true
}

const handleEdit = (data: BusinessCategory) => {
  editingId.value = data.id
  parentId.value = data.parent_id
  form.value = { name: data.name }
  dialogVisible.value = true
}

const handleDelete = async (data: BusinessCategory) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除业务类型"${data.name}"吗？${data.children && data.children.length > 0 ? '该分类下的子分类也将被删除。' : ''}`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await businessCategoryApi.delete(data.id)
    if (res.success) {
      ElMessage.success('删除成功')
      await fetchTree()
    } else {
      // Check if deletion was blocked due to contracts
      if (res.data?.contractCount && res.data.contractCount > 0) {
        ElMessage.warning(`无法删除：该分类下有 ${res.data.contractCount} 个合同`)
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleToggleStatus = async (data: BusinessCategory) => {
  try {
    const action = data.status === 'active' ? '禁用' : '启用'
    await ElMessageBox.confirm(
      `确定要${action}业务类型"${data.name}"吗？`,
      '状态变更',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await businessCategoryApi.toggleStatus(data.id)
    if (res.success) {
      ElMessage.success(`${action}成功`)
      await fetchTree()
    } else {
      ElMessage.error(res.message || `${action}失败`)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      if (editingId.value) {
        // Update
        const res = await businessCategoryApi.update(editingId.value, { name: form.value.name })
        if (res.success) {
          ElMessage.success('更新成功')
          dialogVisible.value = false
          await fetchTree()
        } else {
          ElMessage.error(res.message || '更新失败')
        }
      } else {
        // Create
        const res = await businessCategoryApi.create({
          name: form.value.name,
          parent_id: parentId.value
        })
        if (res.success) {
          ElMessage.success('创建成功')
          dialogVisible.value = false
          await fetchTree()
        } else {
          ElMessage.error(res.message || '创建失败')
        }
      }
    } catch (error) {
      ElMessage.error(editingId.value ? '更新失败' : '创建失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleDrop = async (draggingNode: Node, dropNode: Node, dropType: 'prev' | 'inner' | 'next') => {
  try {
    const res = await businessCategoryApi.moveNode({
      nodeId: draggingNode.data.id,
      targetId: dropNode.data.id,
      dropType
    })
    if (res.success) {
      ElMessage.success('移动成功')
    } else {
      ElMessage.error(res.message || '移动失败')
      await fetchTree() // Refresh to restore original state
    }
  } catch (error) {
    ElMessage.error('移动失败')
    await fetchTree() // Refresh to restore original state
  }
}

const allowDrag = (node: Node) => {
  // Only allow dragging active nodes
  return node.data.status === 'active'
}

const allowDrop = (draggingNode: Node, dropNode: Node, type: string) => {
  // Only allow dropping on active nodes
  return dropNode.data.status === 'active'
}

const resetForm = () => {
  form.value = { name: '' }
  editingId.value = null
  parentId.value = null
  formRef.value?.resetFields()
}

// Lifecycle
onMounted(() => {
  fetchTree()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary, #1e293b);
  margin: 0;
}

.tree-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-height: 400px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
}

.tree-node-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-tag {
  margin-left: 4px;
}

.tree-node-actions {
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.tree-container :deep(.el-tree-node__content:hover) .tree-node-actions {
  opacity: 1;
}

.tree-container :deep(.el-tree-node__content) {
  height: 40px;
}

.tree-container :deep(.el-tree-node) {
  margin-bottom: 4px;
}

.tree-container :deep(.el-tree-node__expand-icon) {
  font-size: 16px;
}

/* Disabled node styling */
.tree-container :deep(.el-tree-node) .tree-node-label {
  color: var(--color-text-primary, #1e293b);
}

.tree-container :deep(.el-tree-node[data-status="disabled"]) .tree-node-label {
  color: var(--color-text-secondary, #64748b);
}
</style>
