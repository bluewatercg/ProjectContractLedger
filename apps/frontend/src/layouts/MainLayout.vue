<template>
  <div class="layout-container">
    <!-- 头部 -->
    <div class="layout-header">
      <div class="header-content">
        <div class="header-left">
          <h1>客户合同管理系统</h1>
        </div>
        <div class="header-right">
          <!-- 套装切换器 -->
          <div class="kit-selector" v-if="kitStore.kits.length > 0">
            <el-select
              :model-value="kitStore.currentKitId"
              placeholder="选择套装"
              size="default"
              style="width: 160px"
              @change="handleKitChange"
            >
              <el-option
                v-if="kitStore.kits.length > 1"
                label="全部套账"
                :value="0"
              />
              <el-option
                v-for="kit in kitStore.kits"
                :key="kit.id"
                :label="kit.name"
                :value="kit.id"
              />
            </el-select>
          </div>
          
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :src="userAvatar" :size="32" />
              <span class="username">{{ authStore.user?.full_name }}</span>
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
      <div class="layout-sidebar animate-slide-in-left">
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          router
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>仪表板</span>
          </el-menu-item>
          <el-menu-item index="/business-categories">
            <el-icon><Folder /></el-icon>
            <span>业务类型</span>
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
          <el-menu-item index="/reconciliations">
            <el-icon><DocumentChecked /></el-icon>
            <span>发票对账</span>
          </el-menu-item>
          <el-menu-item index="/reports">
            <el-icon><DataAnalysis /></el-icon>
            <span>报表中心</span>
          </el-menu-item>
          <el-menu-item index="/user-list">
            <el-icon><Avatar /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/kits">
            <el-icon><Files /></el-icon>
            <span>套账管理</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 主内容区域 -->
      <div class="layout-main">
        <router-view v-slot="{ Component, route }">
          <transition :name="route.meta.transition || 'fade'" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </div>
    </div>

    <!-- 移动端底部导航 -->
    <MobileBottomNav />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useKitStore } from '@/stores/kit'
import MobileBottomNav from '@/components/MobileBottomNav.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const kitStore = useKitStore()

// 计算属性
const activeMenu = computed(() => route.path)
const userAvatar = computed(() => `https://api.dicebear.com/7.x/avataaars/svg?seed=${authStore.user?.username}`)

// 处理套装切换
const handleKitChange = (kitId: number) => {
  if (kitStore.switchKit(kitId)) {
    if (kitId === 0) {
      ElMessage.success('已切换到查看全部套账')
    } else {
      ElMessage.success(`已切换到套装: ${kitStore.currentKit?.name}`)
    }
    // 立即强制刷新页面，避免显示混合状态
    window.location.reload()
  }
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
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  transition: all 0.3s ease;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  max-width: 1920px;
  margin: 0 auto;
}

.header-left h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary, #1e293b);
  margin: 0;
  letter-spacing: -0.02em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.kit-selector {
  margin-right: 8px;
}

.current-kit {
  margin-right: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.user-info:hover {
  background: var(--color-bg-hover, #f8fafc);
  border-color: var(--color-border-light, #e2e8f0);
}

.username {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary, #1e293b);
}

.layout-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.layout-sidebar {
  width: 250px;
  background: white;
  box-shadow: 1px 0 0 rgba(15, 23, 42, 0.06);
  overflow-y: auto;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-menu {
  border-right: none;
  height: 100%;
  padding: 16px 12px;
}

/* 优化菜单项样式 */
.sidebar-menu :deep(.el-menu-item) {
  border-radius: 8px;
  margin-bottom: 4px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: var(--color-bg-hover, #f8fafc);
  color: var(--color-text-primary, #1e293b);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  color: var(--color-accent, #3b82f6);
  font-weight: 600;
  position: relative;
}

.sidebar-menu :deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--color-accent, #3b82f6);
  border-radius: 0 2px 2px 0;
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
  font-size: 20px;
  margin-right: 12px;
}

.layout-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: var(--color-bg-primary, #f8fafc);
  scroll-behavior: smooth;
}

/* 移动端底部导航适配 */
@media (max-width: 767px) {
  .layout-sidebar {
    display: none; /* 隐藏侧边栏，使用底部导航 */
  }

  .layout-main {
    padding-bottom: calc(24px + 72px); /* 原padding + 底部导航高度 */
  }
}

/* 自定义滚动条样式 */
.layout-main::-webkit-scrollbar {
  width: 8px;
}

.layout-main::-webkit-scrollbar-track {
  background: transparent;
}

.layout-main::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 4px;
}

.layout-main::-webkit-scrollbar-thumb:hover {
  background: #94A3B8;
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 滑动过渡 */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 缩放过渡 */
.scale-enter-active,
.scale-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .layout-sidebar {
    width: 200px;
  }

  .layout-main {
    padding: 16px;
  }

  .header-content {
    padding: 0 16px;
  }

  .header-left h1 {
    font-size: 1.125rem;
  }
}

@media (max-width: 480px) {
  .layout-sidebar {
    position: fixed;
    left: -250px;
    top: 64px;
    bottom: 0;
    z-index: 999;
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .layout-sidebar.show {
    left: 0;
    box-shadow: 2px 0 8px rgba(15, 23, 42, 0.15);
  }

  .header-left h1 {
    font-size: 1rem;
  }
}
</style>

