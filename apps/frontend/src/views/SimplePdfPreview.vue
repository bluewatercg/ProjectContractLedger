<template>
  <div class="simple-pdf-preview-page">
    <div class="preview-header">
      <h3>PDF 预览</h3>
      <el-button @click="closePreview" type="primary" size="small">
        关闭预览
      </el-button>
    </div>
    
    <SimplePdfViewer 
      v-if="attachmentId" 
      :attachment-id="attachmentId" 
      class="preview-content"
    />
    
    <div v-else class="error-container">
      <p>错误：未提供有效的附件ID。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SimplePdfViewer from '@/components/SimplePdfViewer.vue'

const route = useRoute()
const attachmentId = ref<number | null>(null)

onMounted(() => {
  const idFromQuery = route.query.attachmentId
  if (typeof idFromQuery === 'string' && idFromQuery) {
    const parsedId = parseInt(idFromQuery, 10)
    if (!isNaN(parsedId)) {
      attachmentId.value = parsedId
    }
  }
})

const closePreview = () => {
  window.close()
}
</script>

<style scoped>
.simple-pdf-preview-page {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.preview-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.preview-content {
  flex: 1;
  margin: 16px;
  height: calc(100vh - 120px);
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
  color: #888;
}
</style>