<template>
  <div class="simple-pdf-viewer">
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
      <span>正在加载PDF预览...</span>
    </div>
    
    <div v-else-if="errorMessage" class="error-container">
      <el-icon class="error-icon">
        <WarningFilled />
      </el-icon>
      <span>{{ errorMessage }}</span>
      <el-button @click="retryLoad" type="primary" size="small" style="margin-top: 10px;">
        重试
      </el-button>
    </div>
    
    <iframe
      v-else-if="pdfBlobUrl"
      :src="pdfBlobUrl"
      class="pdf-iframe"
      frameborder="0"
      @load="onPdfLoad"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Loading, WarningFilled } from '@element-plus/icons-vue'
import { attachmentApi } from '@/api/attachment'

// 定义 props
interface Props {
  attachmentId: number
}

const props = defineProps<Props>()

// 响应式数据
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const pdfBlobUrl = ref<string | null>(null)

// 方法
const loadPdfPreview = async () => {
  if (!props.attachmentId) {
    errorMessage.value = '无效的附件ID'
    return
  }

  loading.value = true
  errorMessage.value = null

  try {
    console.log('开始加载PDF预览，附件ID:', props.attachmentId);
    
    // 直接调用API接口（无认证模式）
    const response = await attachmentApi.getAttachmentBase64(props.attachmentId)
    
    console.log('API响应:', response);
    
    if (!response.success) {
      throw new Error(response.message || '获取PDF数据失败')
    }

    // 将Base64转换为Blob URL
    const base64Data = response.data.base64
    console.log('Base64数据长度:', base64Data.length);
    
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const blob = new Blob([bytes], { type: 'application/pdf' })
    console.log('Blob创建成功，大小:', blob.size);
    
    // 清理之前的Blob URL
    if (pdfBlobUrl.value) {
      URL.revokeObjectURL(pdfBlobUrl.value)
    }
    
    pdfBlobUrl.value = URL.createObjectURL(blob)
    console.log('PDF Blob URL创建成功:', pdfBlobUrl.value);

  } catch (error) {
    console.error('PDF预览加载失败:', error)
    errorMessage.value = error instanceof Error ? error.message : 'PDF预览加载失败'
  } finally {
    loading.value = false
  }
}

const retryLoad = () => {
  loadPdfPreview()
}

const onPdfLoad = () => {
  console.log('PDF iframe加载完成')
}

// 监听附件ID变化
watch(() => props.attachmentId, (newId) => {
  if (newId) {
    loadPdfPreview()
  }
}, { immediate: true })

// 组件卸载时清理Blob URL
onUnmounted(() => {
  if (pdfBlobUrl.value) {
    URL.revokeObjectURL(pdfBlobUrl.value)
  }
})
</script>

<style scoped>
.simple-pdf-viewer {
  width: 100%;
  height: 75vh;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f9f9f9;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #666;
  font-size: 14px;
}

.loading-container .el-icon {
  font-size: 24px;
  margin-bottom: 10px;
  color: #409eff;
}

.error-container .error-icon {
  font-size: 24px;
  margin-bottom: 10px;
  color: #f56c6c;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>