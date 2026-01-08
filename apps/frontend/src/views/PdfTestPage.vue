<template>
  <div class="pdf-test-page">
    <div class="test-header">
      <h2>PDF预览功能测试 (无认证模式)</h2>
      <p>直接测试PDF Base64预览功能</p>
    </div>
    
    <div class="test-content">
      <div class="input-section">
        <label for="attachmentId">附件ID:</label>
        <input 
          id="attachmentId"
          v-model.number="testAttachmentId" 
          type="number" 
          placeholder="输入附件ID (如: 2)"
          min="1"
        />
        <button @click="startTest" :disabled="!testAttachmentId || loading">
          {{ loading ? '加载中...' : '开始测试' }}
        </button>
      </div>
      
      <div v-if="errorMessage" class="error-message">
        <h4>❌ 错误信息:</h4>
        <p>{{ errorMessage }}</p>
      </div>
      
      <div v-if="successMessage" class="success-message">
        <h4>✅ 成功信息:</h4>
        <p>{{ successMessage }}</p>
      </div>
      
      <div v-if="pdfData" class="pdf-info">
        <h4>📊 PDF数据信息:</h4>
        <ul>
          <li>文件名: {{ pdfData.fileName }}</li>
          <li>文件大小: {{ formatSize(pdfData.size) }}</li>
          <li>Base64长度: {{ pdfData.base64.length }} 字符</li>
          <li>内容类型: {{ pdfData.contentType }}</li>
        </ul>
      </div>
      
      <div v-if="testAttachmentId && !loading" class="pdf-preview">
        <h4>📄 PDF预览:</h4>
        <SimplePdfViewer :attachment-id="testAttachmentId" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SimplePdfViewer from '@/components/SimplePdfViewer.vue'
import { attachmentApi } from '@/api/attachment'

// 响应式数据
const testAttachmentId = ref<number>(2) // 默认测试ID
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const pdfData = ref<any>(null)

// 方法
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const startTest = async () => {
  if (!testAttachmentId.value) {
    errorMessage.value = '请输入有效的附件ID'
    return
  }

  loading.value = true
  errorMessage.value = null
  successMessage.value = null
  pdfData.value = null

  try {
    console.log('开始测试附件ID:', testAttachmentId.value)
    
    // 调用API获取PDF数据
    const response = await attachmentApi.getAttachmentBase64(testAttachmentId.value)
    
    console.log('API响应:', response)
    
    if (response.success) {
      pdfData.value = response.data
      successMessage.value = `PDF数据获取成功！文件: ${response.data.fileName}`
    } else {
      errorMessage.value = response.message || '获取PDF数据失败'
    }
  } catch (error) {
    console.error('测试失败:', error)
    errorMessage.value = error instanceof Error ? error.message : '测试过程中发生未知错误'
  } finally {
    loading.value = false
  }
}

// 页面加载时自动测试
startTest()
</script>

<style scoped>
.pdf-test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
}

.test-header h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.test-header p {
  margin: 0;
  opacity: 0.9;
}

.test-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.input-section label {
  font-weight: bold;
  color: #333;
}

.input-section input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 200px;
}

.input-section button {
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.input-section button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.input-section button:hover:not(:disabled) {
  background: #66b3ff;
}

.error-message {
  padding: 15px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
}

.success-message {
  padding: 15px;
  background: #efe;
  border: 1px solid #cfc;
  border-radius: 8px;
  color: #393;
}

.pdf-info {
  padding: 15px;
  background: #f0f8ff;
  border: 1px solid #add8e6;
  border-radius: 8px;
}

.pdf-info ul {
  margin: 10px 0 0 0;
  padding-left: 20px;
}

.pdf-info li {
  margin: 5px 0;
  color: #333;
}

.pdf-preview {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px;
  background: white;
}

.pdf-preview h4 {
  margin: 0 0 15px 0;
  color: #333;
}
</style>