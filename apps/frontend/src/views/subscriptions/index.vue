<template>
  <div class="subscription-list-container">
    <div class="header-section">
      <h2>订阅台账</h2>
      <el-button type="primary" @click="showCreateDialog">+ 新增订阅</el-button>
    </div>

    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input 
            v-model="searchForm.search" 
            placeholder="事项名称/主体/备注" 
            @keyup.enter="handleSearch"
            clearable
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="store.subscriptions" v-loading="store.loading" style="width: 100%" stripe>
      <el-table-column prop="name" label="事项名称" show-overflow-tooltip />
      <el-table-column prop="type.name" label="事项类型" width="120" />
      <el-table-column prop="subject" label="所属主体" show-overflow-tooltip />
      <el-table-column prop="provider" label="服务商" show-overflow-tooltip />
      <el-table-column prop="owner_name" label="主负责人" width="120" />
      <el-table-column prop="cc_names" label="其他负责人" show-overflow-tooltip />
      <el-table-column prop="notes" label="备注" show-overflow-tooltip />
      <el-table-column label="当前状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '已启用' : '已停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetail(row)">查看</el-button>
          <el-button size="small" type="primary" @click="showEditDialog(row)">编辑</el-button>
          <el-popconfirm
            :title="`确定要${row.status === 'active' ? '停用' : '恢复启用'}此项吗？`"
            @confirm="toggleStatus(row)"
          >
            <template #reference>
              <el-button size="small" :type="row.status === 'active' ? 'warning' : 'success'">
                {{ row.status === 'active' ? '停用此项' : '恢复启用' }}
              </el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="store.pagination.page"
      v-model:page-size="store.pagination.limit"
      :total="store.pagination.total"
      :page-sizes="[20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="pagination"
    />

    <!-- 新增/编辑对话框 -->
    <el-dialog 
      :title="isEditing ? '编辑订阅' : '新增订阅'" 
      v-model="dialogVisible" 
      width="600px"
      destroy-on-close
    >
      <el-form 
        :model="form" 
        :rules="rules" 
        ref="formRef"
        label-width="100px"
        :disabled="formSubmitting"
      >
        <el-form-item label="事项名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入事项名称" />
        </el-form-item>
        <el-form-item label="事项类型" prop="type_id">
          <el-select v-model="form.type_id" placeholder="请选择事项类型" style="width: 100%">
            <el-option 
              v-for="type in store.subscriptionTypes" 
              :key="type.id" 
              :label="type.name" 
              :value="type.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属主体" prop="subject">
          <el-input v-model="form.subject" placeholder="请输入所属主体" />
        </el-form-item>
        <el-form-item label="服务商">
          <el-input v-model="form.provider" placeholder="请输入服务商" />
        </el-form-item>
        <el-form-item label="主负责人">
          <el-input v-model="form.owner_name" placeholder="请输入主负责人姓名" />
        </el-form-item>
        <el-form-item label="其他负责人">
          <el-input 
            v-model="form.cc_names" 
            type="textarea"
            :rows="2"
            placeholder="请输入其他负责人姓名，多个用逗号分隔" 
          />
        </el-form-item>
        <el-form-item label="费用">
          <el-input-number v-model="form.fee" :precision="2" :step="100" placeholder="请输入费用" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="form.notes" 
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息" 
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch
            v-model="form.status"
            :active-value="'active'"
            :inactive-value="'inactive'"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false" :disabled="formSubmitting">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="formSubmitting">
          {{ isEditing ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSubscriptionStore } from '@/stores/subscription'
import type { Subscription } from '@/api/types'

const router = useRouter()
const store = useSubscriptionStore()

const dialogVisible = ref(false)
const isEditing = ref(false)
const formSubmitting = ref(false)
const formRef = ref()

const form = reactive<Omit<Subscription, 'id'>>({
  type_id: undefined,
  name: '',
  subject: '',
  provider: null,
  owner_name: null,
  owner_user_id: null,
  cc_user_ids: null,
  cc_names: null,
  fee: null,
  notes: null,
  status: 'active'
})

const rules = {
  name: [{ required: true, message: '请输入事项名称', trigger: 'blur' }],
  type_id: [{ required: true, message: '请选择事项类型', trigger: 'change' }],
  subject: [{ required: true, message: '请输入所属主体', trigger: 'blur' }]
}

const searchForm = reactive({
  search: '',
  status: ''
})

const handleSearch = () => {
  store.fetchSubscriptions(searchForm)
}

const resetSearch = () => {
  searchForm.search = ''
  searchForm.status = ''
  store.pagination.page = 1
  handleSearch()
}

const handleSizeChange = (size: number) => {
  store.pagination.limit = size
  store.fetchSubscriptions(searchForm)
}

const handleCurrentChange = (page: number) => {
  store.pagination.page = page
  store.fetchSubscriptions(searchForm)
}

const showCreateDialog = () => {
  isEditing.value = false
  Object.assign(form, {
    type_id: undefined,
    name: '',
    subject: '',
    provider: null,
    owner_name: null,
    owner_user_id: null,
    cc_user_ids: null,
    cc_names: null,
    fee: null,
    notes: null,
    status: 'active'
  })
  dialogVisible.value = true
}

const showEditDialog = (row: Subscription) => {
  isEditing.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value.validate()
  formSubmitting.value = true
  
  try {
    let response
    if (isEditing.value) {
      response = await store.updateSubscription(store.currentSubscription!.id, { ...form })
    } else {
      response = await store.createSubscription({ ...form })
    }
    
    if (response.success) {
      ElMessage.success(isEditing.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      store.fetchSubscriptions(searchForm)
    } else {
      ElMessage.error(response.message || (isEditing.value ? '更新失败' : '创建失败'))
    }
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    formSubmitting.value = false
  }
}

const viewDetail = (row: Subscription) => {
  router.push(`/subscriptions/${row.id}`)
}

const toggleStatus = async (row: Subscription) => {
  if (row.status === 'active') {
    await store.disableSubscription(row.id)
    ElMessage.success('停用成功')
  } else {
    await store.enableSubscription(row.id)
    ElMessage.success('启用成功')
  }
  store.fetchSubscriptions(searchForm)
}

onMounted(() => {
  store.fetchSubscriptionTypes()
  store.fetchSubscriptions(searchForm)
})
</script>

<style scoped>
.subscription-list-container {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}
</style>