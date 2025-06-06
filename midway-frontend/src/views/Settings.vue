<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">系统设置</h2>
    </div>
    
    <el-tabs v-model="activeTab" type="card">
      <!-- 个人信息 -->
      <el-tab-pane label="个人信息" name="profile">
        <div class="settings-section">
          <h3>个人信息</h3>
          <el-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="100px"
            style="max-width: 600px"
          >
            <el-form-item label="用户名" prop="username">
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>
            
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="profileForm.email" />
            </el-form-item>
            
            <el-form-item label="姓名" prop="full_name">
              <el-input v-model="profileForm.full_name" />
            </el-form-item>
            
            <el-form-item label="电话" prop="phone">
              <el-input v-model="profileForm.phone" />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="updateProfile">更新信息</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
      
      <!-- 密码修改 -->
      <el-tab-pane label="密码修改" name="password">
        <div class="settings-section">
          <h3>修改密码</h3>
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
            style="max-width: 600px"
          >
            <el-form-item label="当前密码" prop="currentPassword">
              <el-input v-model="passwordForm.currentPassword" type="password" show-password />
            </el-form-item>
            
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>
            
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="updatePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
      
      <!-- 系统配置 -->
      <el-tab-pane label="系统配置" name="system">
        <div class="settings-section">
          <h3>系统配置</h3>
          <el-form label-width="120px" style="max-width: 600px">
            <el-form-item label="语言设置">
              <el-select v-model="systemSettings.language" style="width: 200px">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="时区设置">
              <el-select v-model="systemSettings.timezone" style="width: 200px">
                <el-option label="北京时间 (UTC+8)" value="Asia/Shanghai" />
                <el-option label="纽约时间 (UTC-5)" value="America/New_York" />
                <el-option label="伦敦时间 (UTC+0)" value="Europe/London" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="主题设置">
              <el-radio-group v-model="systemSettings.theme">
                <el-radio label="light">浅色主题</el-radio>
                <el-radio label="dark">深色主题</el-radio>
                <el-radio label="auto">跟随系统</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="邮件通知">
              <el-switch v-model="systemSettings.emailNotifications" />
            </el-form-item>
            
            <el-form-item label="桌面通知">
              <el-switch v-model="systemSettings.desktopNotifications" />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="updateSystemSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
      
      <!-- 关于系统 -->
      <el-tab-pane label="关于系统" name="about">
        <div class="settings-section">
          <h3>关于系统</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="系统名称">客户合同管理系统</el-descriptions-item>
            <el-descriptions-item label="版本号">v1.0.0</el-descriptions-item>
            <el-descriptions-item label="技术栈">Vue 3 + TypeScript + Element Plus + Midway</el-descriptions-item>
            <el-descriptions-item label="开发团队">Midway开发团队</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ new Date().toLocaleDateString('zh-CN') }}</el-descriptions-item>
            <el-descriptions-item label="许可证">MIT License</el-descriptions-item>
          </el-descriptions>
          
          <div style="margin-top: 24px;">
            <h4>功能特性</h4>
            <ul style="margin-top: 12px; padding-left: 20px;">
              <li>客户信息管理</li>
              <li>合同生命周期管理</li>
              <li>发票开具与跟踪</li>
              <li>支付记录管理</li>
              <li>数据统计与分析</li>
              <li>用户权限管理</li>
            </ul>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 状态
const activeTab = ref('profile')
const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

// 个人信息表单
const profileForm = reactive({
  username: '',
  email: '',
  full_name: '',
  phone: ''
})

// 密码修改表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 系统设置
const systemSettings = reactive({
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  theme: 'light',
  emailNotifications: true,
  desktopNotifications: false
})

// 个人信息验证规则
const profileRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

// 密码修改验证规则
const passwordRules: FormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 初始化个人信息
const initProfileForm = () => {
  if (authStore.user) {
    profileForm.username = authStore.user.username
    profileForm.email = authStore.user.email || ''
    profileForm.full_name = authStore.user.full_name || ''
    profileForm.phone = authStore.user.phone || ''
  }
}

// 更新个人信息
const updateProfile = async () => {
  if (!profileFormRef.value) return
  
  try {
    await profileFormRef.value.validate()
    // 这里应该调用API更新个人信息
    ElMessage.success('个人信息更新成功')
  } catch (error) {
    console.error('Failed to update profile:', error)
  }
}

// 修改密码
const updatePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    // 这里应该调用API修改密码
    ElMessage.success('密码修改成功')
    
    // 清空表单
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    console.error('Failed to update password:', error)
  }
}

// 更新系统设置
const updateSystemSettings = () => {
  // 这里应该保存到本地存储或调用API
  localStorage.setItem('systemSettings', JSON.stringify(systemSettings))
  ElMessage.success('系统设置保存成功')
}

// 加载系统设置
const loadSystemSettings = () => {
  const saved = localStorage.getItem('systemSettings')
  if (saved) {
    try {
      Object.assign(systemSettings, JSON.parse(saved))
    } catch (error) {
      console.error('Failed to load system settings:', error)
    }
  }
}

// 组件挂载时初始化
onMounted(() => {
  initProfileForm()
  loadSystemSettings()
})
</script>

<style scoped>
.settings-section {
  padding: 24px 0;
}

.settings-section h3 {
  margin-bottom: 24px;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.settings-section h4 {
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.settings-section ul {
  color: #666;
  line-height: 1.6;
}

.settings-section li {
  margin-bottom: 8px;
}
</style>
