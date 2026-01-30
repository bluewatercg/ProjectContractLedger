<template>
  <el-dialog
    v-model="visible"
    title="打印预览"
    width="90%"
    :fullscreen="fullscreen"
    @close="handleClose"
  >
    <template #header>
      <div class="print-header">
        <span>打印预览</span>
        <div class="print-actions">
          <el-button :icon="fullscreen ? 'FullScreen' : 'FullScreen'" circle @click="toggleFullscreen" />
          <el-button type="primary" :icon="Printer" @click="handlePrint">打印</el-button>
        </div>
      </div>
    </template>

    <div class="print-preview-content" ref="printContentRef">
      <!-- 打印头部 -->
      <div class="print-page-header">
        <h1>{{ reportTitle }}</h1>
        <div class="print-meta">
          <div class="print-meta-item">
            <span class="label">生成时间：</span>
            <span class="value">{{ currentDateTime }}</span>
          </div>
          <div class="print-meta-item" v-if="kitName">
            <span class="label">套账：</span>
            <span class="value">{{ kitName }}</span>
          </div>
          <div class="print-meta-item" v-if="dateRange">
            <span class="label">日期范围：</span>
            <span class="value">{{ dateRange }}</span>
          </div>
        </div>
      </div>

      <!-- 打印内容 -->
      <div class="print-body">
        <slot />
      </div>

      <!-- 打印页脚 -->
      <div class="print-page-footer">
        <div class="footer-left">客户合同管理系统</div>
        <div class="footer-right">第 <span class="page-number"></span> 页</div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Printer } from '@element-plus/icons-vue'
import { useKitStore } from '@/stores/kit'

// Props
interface Props {
  modelValue: boolean
  reportTitle?: string
  dateRange?: string
}

const props = withDefaults(defineProps<Props>(), {
  reportTitle: '报表',
  dateRange: ''
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// State
const kitStore = useKitStore()
const printContentRef = ref<HTMLElement>()
const fullscreen = ref(false)

// Computed
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const currentDateTime = computed(() => {
  const now = new Date()
  return now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const kitName = computed(() => {
  if (kitStore.currentKitId === 0) {
    return '全部套账'
  }
  return kitStore.currentKit?.name || ''
})

// Methods
const handleClose = () => {
  visible.value = false
}

const toggleFullscreen = () => {
  fullscreen.value = !fullscreen.value
}

const handlePrint = () => {
  window.print()
}
</script>

<style scoped>
.print-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.print-actions {
  display: flex;
  gap: 8px;
}

.print-preview-content {
  background: white;
  padding: 40px;
  min-height: 600px;
}

.print-page-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #303133;
}

.print-page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  text-align: center;
}

.print-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 14px;
  color: #606266;
}

.print-meta-item {
  display: flex;
  gap: 4px;
}

.print-meta-item .label {
  font-weight: 500;
}

.print-body {
  margin: 20px 0;
}

.print-page-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #DCDFE6;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

/* 打印样式 */
@media print {
  /* 隐藏对话框和非打印元素 */
  :deep(.el-dialog__header),
  :deep(.el-dialog__footer),
  .print-actions {
    display: none !important;
  }

  /* 移除对话框样式 */
  :deep(.el-dialog) {
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  :deep(.el-dialog__body) {
    padding: 0 !important;
  }

  .print-preview-content {
    padding: 20mm;
  }

  /* 设置页面大小和边距 */
  @page {
    size: A4;
    margin: 15mm;
  }

  /* 避免内容被截断 */
  .print-body {
    page-break-inside: avoid;
  }

  /* 表格打印优化 */
  :deep(table) {
    page-break-inside: auto;
  }

  :deep(tr) {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  :deep(thead) {
    display: table-header-group;
  }

  :deep(tfoot) {
    display: table-footer-group;
  }
}
</style>
