<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">客户合同管理系统</h1>
        <p class="login-subtitle">请登录您的账户</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <div class="remember-me">
            <el-checkbox v-model="rememberMe">记住登录状态</el-checkbox>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="isLoading"
            class="login-button"
            @click="handleLogin"
          >
            {{ isLoading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>

        <el-form-item>
          <el-button
            size="large"
            class="demo-button"
            @click="fillDemoAccount"
          >
            使用演示账户
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>还没有账户？<a href="#" @click="showRegister = true">立即注册</a></p>
        <div class="demo-info">
          <el-divider>演示账户</el-divider>
          <p class="demo-text">
            <strong>用户名:</strong> admin<br>
            <strong>密码:</strong> admin123
          </p>
        </div>
      </div>
    </div>
    
    <!-- 注册对话框 -->
    <el-dialog
      v-model="showRegister"
      title="用户注册"
      width="400px"
    >
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="registerForm.email" type="email" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" show-password />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" show-password />
        </el-form-item>
        
        <el-form-item label="姓名" prop="full_name">
          <el-input v-model="registerForm.full_name" />
        </el-form-item>
        
        <el-form-item label="电话" prop="phone">
          <el-input v-model="registerForm.phone" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showRegister = false">取消</el-button>
        <el-button type="primary" :loading="isRegistering" @click="handleRegister">
          {{ isRegistering ? '注册中...' : '注册' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import type { LoginDto, RegisterDto } from '@/api/types'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 表单引用
const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()

// 状态
const isLoading = ref(false)
const isRegistering = ref(false)
const showRegister = ref(false)
const rememberMe = ref(false)

// 登录表单
const loginForm = reactive<LoginDto>({
  username: '',
  password: ''
})

// 注册表单
const registerForm = reactive<RegisterDto & { confirmPassword: string }>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  full_name: '',
  phone: ''
})

// 登录表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
  ]
}

// 注册表单验证规则
const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],

  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码必须包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  full_name: [
    { max: 50, message: '姓名长度不能超过 50 个字符', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 填充演示账户
const fillDemoAccount = () => {
  loginForm.username = 'admin'
  loginForm.password = 'admin123'
  ElMessage.info('已填充演示账户信息')
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()
    isLoading.value = true

    await authStore.login(loginForm)

    // 如果选择记住登录状态，设置更长的过期时间
    if (rememberMe.value) {
      localStorage.setItem('rememberMe', 'true')
    } else {
      localStorage.removeItem('rememberMe')
    }

    ElMessage.success('登录成功')

    // 重定向到目标页面或仪表板
    const redirect = route.query.redirect as string
    router.push(redirect || '/dashboard')
  } catch (error) {
    console.error('Login failed:', error)
    ElMessage.error(error.message || '登录失败，请检查用户名和密码')
  } finally {
    isLoading.value = false
  }
}

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    await registerFormRef.value.validate()
    isRegistering.value = true

    const { confirmPassword, ...registerData } = registerForm
    await authStore.register(registerData)

    ElMessage.success('注册成功，请登录')
    showRegister.value = false

    // 将注册的用户名填入登录表单
    loginForm.username = registerData.username
    loginForm.password = ''

    // 清空注册表单
    Object.assign(registerForm, {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      phone: ''
    })

    // 重置注册表单验证状态
    registerFormRef.value?.resetFields()
  } catch (error) {
    console.error('Register failed:', error)
    ElMessage.error(error.message || '注册失败，请检查输入信息')
  } finally {
    isRegistering.value = false
  }
}

// 页面初始化
onMounted(() => {
  // 检查是否有记住登录状态
  const remembered = localStorage.getItem('rememberMe')
  if (remembered === 'true') {
    rememberMe.value = true
  }

  // 如果已经登录，直接跳转到仪表板
  if (authStore.isAuthenticated) {
    const redirect = route.query.redirect as string
    router.push(redirect || '/dashboard')
  }
})
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

/* 背景动画装饰 */
.login-container::before {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  top: -250px;
  right: -250px;
  animation: float 6s ease-in-out infinite;
}

.login-container::after {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  bottom: -200px;
  left: -200px;
  animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
}

.login-card {
  width: 420px;
  padding: 48px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeIn 0.8s ease-out 0.2s both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: #0F172A;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  color: #64748B;
  font-size: 0.9375rem;
  font-weight: 500;
}

.login-form {
  margin-bottom: 24px;
}

/* 表单项动画 */
.login-form :deep(.el-form-item) {
  animation: slideInLeft 0.5s ease-out both;
}

.login-form :deep(.el-form-item:nth-child(1)) {
  animation-delay: 0.3s;
}

.login-form :deep(.el-form-item:nth-child(2)) {
  animation-delay: 0.4s;
}

.login-form :deep(.el-form-item:nth-child(3)) {
  animation-delay: 0.5s;
}

.login-form :deep(.el-form-item:nth-child(4)) {
  animation-delay: 0.6s;
}

.login-form :deep(.el-form-item:nth-child(5)) {
  animation-delay: 0.7s;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 输入框增强 */
.login-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.1) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.2) inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #667eea inset;
  background: white;
}

.login-form :deep(.el-input__inner) {
  font-size: 0.9375rem;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.login-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.login-button:hover::before {
  left: 100%;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.login-button:active {
  transform: translateY(0);
}

.demo-button {
  width: 100%;
  height: 44px;
  margin-top: 12px;
  background-color: #F8FAFC;
  border: 2px solid #E2E8F0;
  color: #475569;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.demo-button:hover {
  background-color: #F1F5F9;
  border-color: #CBD5E1;
  color: #0F172A;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
}

.remember-me {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.remember-me :deep(.el-checkbox__label) {
  font-size: 0.875rem;
  color: #64748B;
}

.login-footer {
  text-align: center;
  animation: fadeIn 1s ease-out 0.8s both;
}

.login-footer p {
  font-size: 0.875rem;
  color: #64748B;
  margin-bottom: 20px;
}

.login-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.login-footer a:hover {
  color: #764ba2;
  text-decoration: underline;
}

.demo-info {
  margin-top: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
  border-radius: 12px;
  border: 2px solid #E2E8F0;
  transition: all 0.3s ease;
}

.demo-info:hover {
  border-color: #CBD5E1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.demo-info :deep(.el-divider__text) {
  font-weight: 600;
  color: #475569;
  font-size: 0.875rem;
}

.demo-text {
  font-size: 0.875rem;
  color: #64748B;
  margin: 0;
  line-height: 1.8;
}

.demo-text strong {
  color: #0F172A;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    width: 90%;
    padding: 32px 24px;
    margin: 20px;
    border-radius: 16px;
  }

  .login-title {
    font-size: 1.75rem;
  }

  .login-button {
    height: 44px;
  }
}

/* 加载状态优化 */
.login-button.is-loading {
  pointer-events: none;
}

.login-button.is-loading :deep(.el-icon) {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
