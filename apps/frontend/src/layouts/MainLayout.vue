<template>
  <div class="layout-container">
    <!-- 头部 -->
    <div class="layout-header">
      <div class="header-content">
        <div class="header-left">
          <h1>客户合同管理系统</h1>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :src="userAvatar" :size="32" />
              <span class="username">{{ authStore.user?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="settings">系统设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
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

      <!-- 主内容区域 -->
      <div class="layout-main">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 计算属性
const activeMenu = computed(() => route.path)
const userAvatar = computed(() => `https://api.dicebear.com/7.x/avataaars/svg?seed=${authStore.user?.username}`)

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
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

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

.layout-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.layout-sidebar {
  width: 250px;
  background: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.sidebar-menu {
  border-right: none;
  height: 100%;
}

.layout-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #f5f5f5;
}

@media (max-width: 768px) {
  .layout-sidebar {
    width: 200px;
  }
  
  .layout-main {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .layout-sidebar {
    display: none;
  }
}
</style>
