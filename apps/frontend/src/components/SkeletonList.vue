<template>
  <div class="skeleton-list">
    <div v-for="i in rows" :key="i" class="skeleton-item">
      <el-skeleton :rows="3" animated>
        <template #template>
          <div class="skeleton-card">
            <div class="skeleton-header">
              <el-skeleton-item variant="text" style="width: 40%" />
              <el-skeleton-item variant="text" style="width: 20%" />
            </div>
            <el-skeleton-item variant="text" style="width: 60%; margin-top: 12px" />
            <el-skeleton-item variant="text" style="width: 80%; margin-top: 8px" />
            <div class="skeleton-footer">
              <el-skeleton-item variant="button" style="width: 80px" />
              <el-skeleton-item variant="button" style="width: 80px" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  rows?: number
}

withDefaults(defineProps<Props>(), {
  rows: 3
})
</script>

<style scoped>
.skeleton-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-5);
  padding: var(--spacing-5);
}

.skeleton-item {
  animation: fadeIn 0.3s ease-out;
}

.skeleton-card {
  background: var(--color-bg-container);
  border-radius: var(--radius-base);
  padding: var(--spacing-5);
  box-shadow: var(--shadow-base);
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.skeleton-footer {
  display: flex;
  gap: var(--spacing-2);
  margin-top: var(--spacing-4);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .skeleton-list {
    grid-template-columns: 1fr;
    padding: var(--spacing-4);
  }
}
</style>
