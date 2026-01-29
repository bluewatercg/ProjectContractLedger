<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="loading" class="global-loading">
        <div class="loading-content">
          <el-icon class="loading-icon" :size="48">
            <Loading />
          </el-icon>
          <p class="loading-text">{{ text }}</p>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'

interface Props {
  loading: boolean
  text?: string
}

const props = withDefaults(defineProps<Props>(), {
  text: '加载中...'
})

// 防止背景滚动
watch(() => props.loading, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-icon {
  animation: rotate 1s linear infinite;
  margin-bottom: var(--spacing-4);
}

.loading-text {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  margin: 0;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-base);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
