<template>
  <div class="layout-container">
    <!-- 头部 -->
    <div class="layout-header">
      <el-header class="header-content">
        <div class="header-left">
          <h1>客户合同管理系统</h1>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userAvatar" />
              <span class="username">{{ authStore.user?.full_name || authStore.user?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="settings">系统设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
    </div>

    <!-- 内容区域 -->
    <div class="layout-content">
      <!-- 侧边栏 -->
      <div class="layout-sidebar">
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          router
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>仪表板</span>
          </el-menu-item>
          <el-menu-item index="/customers">
            <el-icon><User /></el-icon>
            <span>客户管理</span>
          </el-menu-item>
          <el-menu-item index="/contracts">
            <el-icon><Document /></el-icon>
            <span>合同管理</span>
          </el-menu-item>
          <el-menu-item index="/invoices">
            <el-icon><Tickets /></el-icon>
            <span>发票管理</span>
          </el-menu-item>
          <el-menu-item index="/payments">
            <el-icon><Money /></el-icon>
            <span>支付管理</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 主内容 -->
      <div class="layout-main">
        <div class="page-container">
          <div class="page-header">
            <h2 class="page-title">仪表板</h2>
            <el-button type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>

          <!-- 统计卡片 -->
          <div class="card-grid" v-loading="loading">
            <div class="stat-card">
              <div class="stat-card-header">
                <span class="stat-card-title">总客户数</span>
                <el-icon class="stat-card-icon"><User /></el-icon>
              </div>
              <div class="stat-card-value">{{ stats?.customers?.total || 0 }}</div>
              <div class="stat-card-change">活跃客户: {{ stats?.customers?.active || 0 }}</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-header">
                <span class="stat-card-title">总合同数</span>
                <el-icon class="stat-card-icon"><Document /></el-icon>
              </div>
              <div class="stat-card-value">{{ stats?.contracts?.total || 0 }}</div>
              <div class="stat-card-change">执行中: {{ stats?.contracts?.active || 0 }}</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-header">
                <span class="stat-card-title">总收入</span>
                <el-icon class="stat-card-icon"><Money /></el-icon>
              </div>
              <div class="stat-card-value">¥{{ formatCurrency(stats?.summary?.totalRevenue || 0) }}</div>
              <div class="stat-card-change">已收: ¥{{ formatCurrency(stats?.summary?.paidAmount || 0) }}</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-header">
                <span class="stat-card-title">待收款</span>
                <el-icon class="stat-card-icon"><Tickets /></el-icon>
              </div>
              <div class="stat-card-value">¥{{ formatCurrency(stats?.summary?.unpaidAmount || 0) }}</div>
              <div class="stat-card-change">逾期: {{ stats?.invoices?.overdue || 0 }} 张</div>
            </div>
          </div>

          <!-- 快速操作 -->
          <div class="quick-actions">
            <h3>快速操作</h3>
            <div class="action-buttons">
              <el-button type="primary" @click="$router.push('/customers/create')">
                <el-icon><Plus /></el-icon>
                新建客户
              </el-button>
              <el-button type="success" @click="$router.push('/contracts/create')">
                <el-icon><Plus /></el-icon>
                新建合同
              </el-button>
              <el-button type="warning" @click="$router.push('/invoices/create')">
                <el-icon><Plus /></el-icon>
                新建发票
              </el-button>
              <el-button type="info" @click="$router.push('/payments/create')">
                <el-icon><Plus /></el-icon>
                新建支付
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { statisticsApi } from '@/api'
import type { DashboardStats } from '@/api/types'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 状态
const loading = ref(false)
const stats = ref<DashboardStats>()

// 计算属性
const activeMenu = computed(() => route.path)
const userAvatar = computed(() => `https://api.dicebear.com/7.x/avataaars/svg?seed=${authStore.user?.username}`)

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount)
}

// 获取统计数据
const fetchStats = async () => {
  try {
    loading.value = true
    const response = await statisticsApi.getDashboardStats()
    if (response.success) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchStats()
  ElMessage.success('数据已刷新')
}

// 处理用户菜单命令
const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人资料功能开发中')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        authStore.logout()
        router.push('/login')
        ElMessage.success('已退出登录')
      } catch {
        // 用户取消
      }
      break
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
}

.header-left h1 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.username {
  font-size: 14px;
  color: #333;
}

.sidebar-menu {
  border-right: none;
  height: 100%;
}

.quick-actions {
  margin-top: 32px;
}

.quick-actions h3 {
  margin-bottom: 16px;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
