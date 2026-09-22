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
                <el-dropdown-item divided command="logout"
                  >退出登录</el-dropdown-item
                >
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
        <el-menu :default-active="activeMenu" class="sidebar-menu" router>
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
          <el-menu-item index="/subscriptions">
            <el-icon><Bell /></el-icon>
            <span>订阅台账</span>
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
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAuthStore } from "@/stores/auth";
import { useKitStore } from "@/stores/kit";
import MobileBottomNav from "@/components/MobileBottomNav.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const kitStore = useKitStore();

// 计算属性
const activeMenu = computed(() => route.path);
const userAvatar = computed(
  () =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${authStore.user?.username}`,
);

const kitRouteFallbackMap: Record<string, string> = {
  CustomerDetail: "/customers",
  CustomerEdit: "/customers",
  ContractDetail: "/contracts",
  ContractEdit: "/contracts",
  InvoiceDetail: "/invoices",
  InvoiceEdit: "/invoices",
  PaymentDetail: "/payments",
  PaymentEdit: "/payments",
  ReconciliationDetail: "/reconciliations",
  SubscriptionDetail: "/subscriptions",
};

// 处理套装切换
const handleKitChange = async (kitId: number) => {
  if (kitStore.switchKit(kitId)) {
    if (kitId === 0) {
      ElMessage.success("已切换到查看全部套账");
    } else {
      ElMessage.success(`已切换到套装: ${kitStore.currentKit?.name}`);
    }

    const routeName = route.name ? String(route.name) : "";
    const fallbackPath = kitRouteFallbackMap[routeName];
    if (fallbackPath && route.path !== fallbackPath) {
      try {
        await router.replace(fallbackPath);
      } catch (error) {
        console.error("Route fallback failed on kit switch:", error);
      }
    }

    // 立即强制刷新页面，避免显示混合状态
    window.location.reload();
  }
};

// 处理用户菜单命令
const handleCommand = async (command: string) => {
  switch (command) {
    case "profile":
      ElMessage.info("个人资料功能开发中");
      break;
    case "settings":
      router.push("/settings");
      break;
    case "logout":
      try {
        await ElMessageBox.confirm("确定要退出登录吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });
        authStore.logout();
        router.push("/login");
        ElMessage.success("已退出登录");
      } catch {
        // 用户取消
      }
      break;
  }
};
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
  box-shadow: 0 1px 2px rgba(13, 37, 61, 0.04);
  border-bottom: 1px solid var(--color-border-base, #e3e8ee);
  transition: box-shadow 0.2s ease;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  max-width: 1920px;
  margin: 0 auto;
  min-width: 0;
  gap: 12px;
}

.header-left {
  min-width: 0;
  flex-shrink: 1;
}

.header-left h1 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary, #0d253d);
  margin: 0;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.kit-selector {
  margin-right: 4px;
}

.current-kit {
  margin-right: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 999px;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
  border: 1px solid transparent;
}

.user-info:hover {
  background: var(--color-bg-active, #f0edff);
  border-color: var(--color-border-base, #e3e8ee);
}

.username {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-regular, #273951);
  font-variant-numeric: tabular-nums;
}

.layout-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.layout-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--color-bg-container, #fff);
  border-right: 1px solid var(--color-border-base, #e3e8ee);
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-menu {
  border-right: none;
  height: 100%;
  padding: 12px 10px;
  background: transparent;
}

.sidebar-menu :deep(.el-menu-item) {
  border-radius: 6px;
  margin-bottom: 2px;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-text-regular, #273951);
  transition:
    background 0.15s ease,
    color 0.15s ease;
  height: 40px;
  line-height: 40px;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: var(--color-bg-page, #f6f9fc);
  color: var(--color-text-primary, #0d253d);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: var(--color-bg-active, #f0edff);
  color: var(--color-primary, #533afd);
  font-weight: 600;
}

.sidebar-menu :deep(.el-menu-item.is-active::before) {
  display: none;
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 10px;
}

.layout-main {
  flex: 1;
  min-width: 0;
  padding: 24px;
  overflow-y: auto;
  background: var(--color-bg-page, #f6f9fc);
  scroll-behavior: smooth;
}

@media (max-width: 767px) {
  .layout-sidebar {
    display: none;
  }
}

.layout-main::-webkit-scrollbar {
  width: 6px;
}

.layout-main::-webkit-scrollbar-track {
  background: transparent;
}

.layout-main::-webkit-scrollbar-thumb {
  background: var(--color-border-base, #e3e8ee);
  border-radius: 3px;
}

.layout-main::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted, #64748d);
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.scale-enter-active,
.scale-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.97);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(1.03);
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
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .layout-sidebar {
    position: fixed;
    left: -250px;
    top: 64px;
    bottom: 0;
    z-index: 999;
    transition: left 0.2s ease;
  }

  .layout-sidebar.show {
    left: 0;
    box-shadow: 2px 0 8px rgba(13, 37, 61, 0.1);
  }

  .header-content {
    padding: 0 12px;
    gap: 8px;
  }

  .header-left h1 {
    font-size: 0.9375rem;
  }

  .header-right {
    gap: 8px;
  }

  .username {
    display: none;
  }
}
@media (max-width: 767px) {
  .layout-main {
    padding-bottom: calc(112px + env(safe-area-inset-bottom));
    scroll-padding-bottom: calc(96px + env(safe-area-inset-bottom));
  }
}
</style>
