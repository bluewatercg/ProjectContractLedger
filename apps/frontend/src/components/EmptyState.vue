<template>
  <div class="empty-state">
    <div class="empty-icon">
      <slot name="icon">
        <el-icon :size="80">
          <component :is="icon" />
        </el-icon>
      </slot>
    </div>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <div v-if="$slots.action" class="empty-action">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'
import type { Component } from 'vue'

interface Props {
  icon?: Component
  title: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  icon: Document
})
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: var(--spacing-16) var(--spacing-5);
}

.empty-icon {
  color: var(--color-border-base);
  margin-bottom: var(--spacing-6);
  animation: fadeInUp 0.6s ease-out;
}

.empty-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-3) 0;
  animation: fadeInUp 0.6s ease-out 0.1s both;
}

.empty-description {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-6) 0;
  line-height: var(--line-height-relaxed);
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.empty-action {
  animation: fadeInUp 0.6s ease-out 0.3s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .empty-state {
    padding: var(--spacing-12) var(--spacing-4);
  }

  .empty-icon :deep(.el-icon) {
    font-size: 60px !important;
  }

  .empty-title {
    font-size: var(--font-size-lg);
  }

  .empty-description {
    font-size: var(--font-size-sm);
  }
}
</style>
