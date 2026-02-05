<template>
  <nav v-if="isMobile" class="mobile-bottom-nav">
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="nav-item"
      :class="{ active: isActive(item.path) }"
    >
      <div class="nav-icon-wrapper">
        <el-icon class="nav-icon">
          <component :is="item.icon" />
        </el-icon>
        <el-badge
          v-if="item.badge"
          :value="item.badge"
          :max="99"
          class="nav-badge"
        />
      </div>
      <span class="nav-label">{{ item.label }}</span>
      <div v-if="isActive(item.path)" class="nav-indicator"></div>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  Odometer,
  User,
  Document,
  Tickets,
  Money,
  DataAnalysis
} from '@element-plus/icons-vue'

const route = useRoute()

// 导航项配置
const navItems = ref([
  {
    path: '/dashboard',
    icon: Odometer,
    label: '首页',
    badge: 0
  },
  {
    path: '/contracts',
    icon: Document,
    label: '合同',
    badge: 0
  },
  {
    path: '/invoices',
    icon: Tickets,
    label: '发票',
    badge: 0
  },
  {
    path: '/payments',
    icon: Money,
    label: '收款',
    badge: 0
  },
  {
    path: '/reports',
    icon: DataAnalysis,
    label: '报表',
    badge: 0
  }
])

// 检测是否为移动端
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// 判断当前路由是否激活
const isActive = (path: string) => {
  return route.path.startsWith(path)
}

// 监听窗口大小变化
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 -2px 12px rgba(15, 23, 42, 0.06);
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  z-index: 1000;
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  min-width: 0;
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-item.active {
  color: var(--color-accent);
}

.nav-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.nav-icon {
  font-size: 24px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item.active .nav-icon {
  transform: scale(1.1);
}

.nav-badge {
  position: absolute;
  top: -4px;
  right: -4px;
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item.active .nav-label {
  font-weight: 600;
}

.nav-indicator {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: var(--color-accent);
  border-radius: 0 0 3px 3px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

/* 触觉反馈效果 */
@media (hover: none) {
  .nav-item:active {
    background: var(--color-bg-hover);
    border-radius: 12px;
  }
}

/* 适配安全区域 */
@supports (padding: max(0px)) {
  .mobile-bottom-nav {
    padding-bottom: max(8px, env(safe-area-inset-bottom));
  }
}

/* 横屏适配 */
@media (max-height: 500px) and (orientation: landscape) {
  .mobile-bottom-nav {
    padding: 4px 0 calc(4px + env(safe-area-inset-bottom));
  }

  .nav-item {
    padding: 4px 4px;
    gap: 2px;
  }

  .nav-icon {
    font-size: 20px;
  }

  .nav-label {
    font-size: 0.625rem;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .mobile-bottom-nav {
    background: rgba(15, 23, 42, 0.95);
    border-top-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
