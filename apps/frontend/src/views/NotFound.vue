<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="not-found-icon">
        <el-icon size="120"><Warning /></el-icon>
      </div>
      <h1 class="not-found-title">404</h1>
      <p class="not-found-message">抱歉，您访问的页面不存在</p>
      <div class="not-found-actions">
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <el-button @click="goBack">返回上页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.not-found-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.not-found-content {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.not-found-icon {
  color: #e6a23c;
  margin-bottom: 24px;
}

.not-found-title {
  font-size: 72px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.not-found-message {
  font-size: 18px;
  color: #666;
  margin-bottom: 32px;
}

.not-found-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>
