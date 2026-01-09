<template>
  <div class="user-form-container">
    <div class="page-header">
      <el-page-header @back="handleBack">
        <template #content>
          <span class="text-large font-600 mr-3">
            {{ isEdit ? '编辑用户' : '新建用户' }}
          </span>
        </template>
      </el-page-header>
    </div>

    <div class="form-content">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="user-form"
        v-loading="loading"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" placeholder="请输入用户名" />
        </el-form-item>
        
       
        
        <el-form-item label="密码" prop="password" :required="!isEdit">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（编辑时留空表示不修改）"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="姓名" prop="full_name">
          <el-input v-model="form.full_name" placeholder="请输入真实姓名" />
        </el-form-item>
        
       
        
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getUserDetail, createUser, updateUser } from '@/api/user'
import type { CreateUserParams } from '@/api/user'

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const isEdit = computed(() => {
  return !!route.params.id
})

const form = reactive({
  username: '',
  email: '',
  password: '',
  full_name: '',
  phone: '',
  role: 'user',
  status: 'active'
})

const rules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
 
  full_name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
})

// 加载数据
const loadData = async (id: number) => {
  loading.value = true
  try {
    const res = await getUserDetail(id)
    if (res) {
      form.username = res.username
      form.email = res.email
      form.full_name = res.full_name || ''
      form.phone = res.phone || ''
      form.role = res.role
      form.status = res.status
    }
  } catch (error) {
    console.error('Failed to load user detail:', error)
    ElMessage.error('获取用户详情失败')
  } finally {
    loading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid, fields) => {
    if (valid) {
      loading.value = true
      try {
        if (isEdit.value) {
          const id = Number(route.params.id)
          const params: any = { ...form }
          if (!params.password) {
            delete params.password
          }
          delete params.username // 不更新用户名
          await updateUser(id, params)
          ElMessage.success('更新成功')
        } else {
          await createUser(form)
          ElMessage.success('创建成功')
        }
        router.push('/user-list')
      } catch (error: any) {
        console.error('Failed to submit form:', error)
        ElMessage.error(error.message || '操作失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  if (isEdit.value) {
    loadData(Number(route.params.id))
  }
})
</script>

<style scoped>
.user-form-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
}

.page-header {
  margin-bottom: 24px;
}

.form-content {
  max-width: 600px;
}
</style>
