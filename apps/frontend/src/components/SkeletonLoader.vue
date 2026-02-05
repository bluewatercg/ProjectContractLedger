<template>
  <div class="skeleton-loader" :class="{ 'skeleton-dark': dark }">
    <!-- 卡片骨架屏 -->
    <div v-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-card-header">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton-card-info">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text" style="width: 60%"></div>
        </div>
      </div>
      <div class="skeleton-card-body">
        <div class="skeleton skeleton-text" v-for="i in rows" :key="i"></div>
      </div>
    </div>

    <!-- 表格骨架屏 -->
    <div v-else-if="type === 'table'" class="skeleton-table">
      <div class="skeleton-table-header">
        <div class="skeleton skeleton-text" v-for="i in columns" :key="i"></div>
      </div>
      <div class="skeleton-table-row" v-for="i in rows" :key="i">
        <div class="skeleton skeleton-text" v-for="j in columns" :key="j"></div>
      </div>
    </div>

    <!-- 列表骨架屏 -->
    <div v-else-if="type === 'list'" class="skeleton-list">
      <div class="skeleton-list-item" v-for="i in rows" :key="i">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton-list-content">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text" style="width: 80%"></div>
          <div class="skeleton skeleton-text" style="width: 60%"></div>
        </div>
      </div>
    </div>

    <!-- 表单骨架屏 -->
    <div v-else-if="type === 'form'" class="skeleton-form">
      <div class="skeleton-form-section" v-for="i in sections" :key="i">
        <div class="skeleton skeleton-title" style="width: 30%; margin-bottom: 20px"></div>
        <div class="skeleton-form-grid">
          <div class="skeleton-form-item" v-for="j in 4" :key="j">
            <div class="skeleton skeleton-text" style="width: 40%; height: 14px; margin-bottom: 8px"></div>
            <div class="skeleton skeleton-input"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 仪表板骨架屏 -->
    <div v-else-if="type === 'dashboard'" class="skeleton-dashboard">
      <!-- 统计卡片 -->
      <div class="skeleton-stats">
        <div class="skeleton-stat-card" v-for="i in 4" :key="i">
          <div class="skeleton skeleton-text" style="width: 50%; margin-bottom: 12px"></div>
          <div class="skeleton skeleton-title" style="width: 70%"></div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="skeleton-charts">
        <div class="skeleton-chart" v-for="i in 2" :key="i">
          <div class="skeleton skeleton-title" style="width: 40%; margin-bottom: 16px"></div>
          <div class="skeleton skeleton-chart-area"></div>
        </div>
      </div>
    </div>

    <!-- 详情页骨架屏 -->
    <div v-else-if="type === 'detail'" class="skeleton-detail">
      <div class="skeleton-detail-header">
        <div class="skeleton skeleton-avatar-large"></div>
        <div class="skeleton-detail-info">
          <div class="skeleton skeleton-title" style="width: 60%; margin-bottom: 12px"></div>
          <div class="skeleton skeleton-text" style="width: 40%; margin-bottom: 8px"></div>
          <div class="skeleton skeleton-text" style="width: 50%"></div>
        </div>
      </div>
      <div class="skeleton-detail-body">
        <div class="skeleton skeleton-text" v-for="i in 6" :key="i"></div>
      </div>
    </div>

    <!-- 自定义骨架屏 -->
    <div v-else class="skeleton-custom">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, withDefaults } from 'vue'

interface Props {
  type?: 'card' | 'table' | 'list' | 'form' | 'dashboard' | 'detail' | 'custom'
  rows?: number
  columns?: number
  sections?: number
  dark?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'card',
  rows: 3,
  columns: 4,
  sections: 2,
  dark: false
})
</script>

<style scoped>
/* 基础骨架屏样式 */
.skeleton-loader {
  width: 100%;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-dark .skeleton {
  background: linear-gradient(
    90deg,
    #2a2a2a 25%,
    #1a1a1a 50%,
    #2a2a2a 75%
  );
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 基础元素 */
.skeleton-text {
  height: 16px;
  margin-bottom: 8px;
  width: 100%;
}

.skeleton-title {
  height: 24px;
  margin-bottom: 12px;
  width: 60%;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-input {
  height: 40px;
  border-radius: 8px;
}

.skeleton-button {
  height: 40px;
  width: 120px;
  border-radius: 8px;
}

/* 卡片骨架屏 */
.skeleton-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.skeleton-card-header {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.skeleton-card-info {
  flex: 1;
}

.skeleton-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 表格骨架屏 */
.skeleton-table {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.skeleton-table-header {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f1f5f9;
}

.skeleton-table-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 16px;
  margin-bottom: 12px;
}

/* 列表骨架屏 */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-list-item {
  display: flex;
  gap: 16px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.skeleton-list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 表单骨架屏 */
.skeleton-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.skeleton-form-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.skeleton-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.skeleton-form-item {
  display: flex;
  flex-direction: column;
}

/* 仪表板骨架屏 */
.skeleton-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.skeleton-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.skeleton-stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.skeleton-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.skeleton-chart {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.skeleton-chart-area {
  height: 300px;
  border-radius: 8px;
}

/* 详情页骨架屏 */
.skeleton-detail {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.skeleton-detail-header {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f1f5f9;
}

.skeleton-detail-info {
  flex: 1;
}

.skeleton-detail-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 响应式 */
@media (max-width: 768px) {
  .skeleton-stats {
    grid-template-columns: 1fr;
  }

  .skeleton-charts {
    grid-template-columns: 1fr;
  }

  .skeleton-form-grid {
    grid-template-columns: 1fr;
  }

  .skeleton-detail-header {
    flex-direction: column;
  }
}
</style>
