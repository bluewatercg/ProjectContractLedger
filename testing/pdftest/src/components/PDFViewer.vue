<template>
  <div class="pdf-viewer">
    <div class="viewer-card">
      <h2>🎯 PDF Base64代理测试</h2>
      
      <!-- 功能介绍 -->
      <div class="info-section">
        <h3>💡 MVP特性：</h3>
        <div class="features">
          <span class="feature-tag">✅ Base64编码防拦截</span>
          <span class="feature-tag">✅ JSON API响应</span>
          <span class="feature-tag">✅ CORS跨域支持</span>
          <span class="feature-tag">✅ Vue3响应式</span>
        </div>
      </div>

      <!-- URL输入区域 -->
      <div class="url-section">
        <div class="input-group">
          <label for="pdfUrl">📎 PDF文件URL:</label>
          <input
            id="pdfUrl"
            v-model="pdfUrl"
            type="url"
            placeholder="输入完整的PDF URL，如: https://example.com/file.pdf"
            @keyup.enter="loadPDF"
          />
        </div>
        
        <!-- 预设URL -->
        <div class="preset-urls">
          <h4>🔗 快速测试:</h4>
          <button 
            v-for="preset in presetUrls" 
            :key="preset.name"
            @click="setPresetUrl(preset.url)"
            class="preset-btn"
          >
            {{ preset.name }}
          </button>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="controls">
        <button 
          @click="loadPDF" 
          :disabled="!pdfUrl || loading"
          class="btn-primary"
        >
          <span v-if="loading">🔄 加载中...</span>
          <span v-else>📄 加载PDF</span>
        </button>
        
        <button 
          @click="testAPI" 
          :disabled="!pdfUrl || loading"
          class="btn-secondary"
        >
          🧪 测试API
        </button>
        
        <button 
          @click="clearViewer"
          :disabled="!showPdf && !showApiResponse"
          class="btn-clear"
        >
          🗑️ 清空
        </button>
      </div>

      <!-- 状态显示 -->
      <div v-if="status.message" :class="`status status-${status.type}`">
        {{ status.message }}
      </div>

      <!-- API响应显示 -->
      <div v-if="showApiResponse" class="api-response">
        <h4>📊 API响应数据:</h4>
        <pre>{{ formattedApiResponse }}</pre>
      </div>

      <!-- PDF显示区域 -->
      <div v-if="showPdf" class="pdf-container">
        <iframe 
          :src="pdfBlobUrl" 
          frameborder="0"
          @load="onPdfLoad"
        ></iframe>
      </div>

      <!-- 占位符 -->
      <div v-if="!showPdf && !showApiResponse && !loading" class="placeholder">
        <div class="placeholder-content">
          <h3>📋 使用说明</h3>
          <ol>
            <li>在上方输入框中输入PDF文件的完整URL</li>
            <li>点击"加载PDF"查看完整预览</li>
            <li>点击"测试API"只查看API响应数据</li>
            <li>使用快速测试按钮体验预设URL</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

// 响应式数据
const pdfUrl = ref('/invoice.pdf')
const loading = ref(false)
const showPdf = ref(false)
const showApiResponse = ref(false)
const pdfBlobUrl = ref('')
const apiResponseData = ref(null)
const status = ref({ message: '', type: 'info' })

// API配置
const API_BASE = 'http://localhost:3003'

// 预设URL
const presetUrls = [
  { name: '本地测试', url: '/invoice.pdf' },
  { name: 'W3C测试', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  { name: 'Adobe样例', url: 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf' }
]

// 计算属性
const formattedApiResponse = computed(() => {
  if (!apiResponseData.value) return ''
  
  const displayData = {
    success: apiResponseData.value.success,
    contentType: apiResponseData.value.contentType,
    size: `${apiResponseData.value.size} bytes`,
    dataLength: apiResponseData.value.data ? `${apiResponseData.value.data.length} chars (Base64)` : 'N/A',
    dataPreview: apiResponseData.value.data ? `${apiResponseData.value.data.substring(0, 100)}...` : 'N/A'
  }
  
  return JSON.stringify(displayData, null, 2)
})

// 方法
const setStatus = (message, type = 'info') => {
  status.value = { message, type }
}

const setPresetUrl = (url) => {
  pdfUrl.value = url
  setStatus(`已设置URL: ${url}`, 'success')
}

// 构建API请求URL
const buildApiUrl = (inputUrl) => {
  const cleanUrl = inputUrl.trim()
  
  // 如果是完整的HTTP URL，需要转换为API路径
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    // 对于外部URL，直接作为路径参数传递
    return `${API_BASE}?url=${encodeURIComponent(cleanUrl)}`
  }
  
  // 如果是相对路径（如 /invoice.pdf），直接拼接
  if (cleanUrl.startsWith('/')) {
    return `${API_BASE}${cleanUrl}`
  }
  
  // 其他情况，添加前导斜杠
  return `${API_BASE}/${cleanUrl}`
}

const loadPDF = async () => {
  if (!pdfUrl.value.trim()) {
    setStatus('请输入有效的PDF URL', 'error')
    return
  }
  
  loading.value = true
  showPdf.value = false
  showApiResponse.value = false
  
  try {
    setStatus('正在加载PDF文件...', 'loading')
    
    const apiUrl = buildApiUrl(pdfUrl.value)
    console.log('API请求URL:', apiUrl)
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || '服务器返回错误')
    }
    
    // 保存API响应数据
    apiResponseData.value = data
    
    // 将Base64转换为Blob URL
    const binaryString = atob(data.data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    const blob = new Blob([bytes], { type: 'application/pdf' })
    
    // 清理之前的Blob URL
    if (pdfBlobUrl.value) {
      URL.revokeObjectURL(pdfBlobUrl.value)
    }
    
    pdfBlobUrl.value = URL.createObjectURL(blob)
    showPdf.value = true
    
    setStatus(`PDF加载成功！文件大小: ${data.size} bytes`, 'success')
    
  } catch (error) {
    console.error('加载PDF失败:', error)
    setStatus(`加载失败: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const testAPI = async () => {
  if (!pdfUrl.value.trim()) {
    setStatus('请输入有效的PDF URL', 'error')
    return
  }
  
  loading.value = true
  showPdf.value = false
  showApiResponse.value = false
  
  try {
    setStatus('正在测试API...', 'loading')
    
    const apiUrl = buildApiUrl(pdfUrl.value)
    console.log('API测试URL:', apiUrl)
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`)
    }
    
    const data = await response.json()
    
    apiResponseData.value = data
    showApiResponse.value = true
    
    setStatus('API测试成功！', 'success')
    
  } catch (error) {
    console.error('API测试失败:', error)
    setStatus(`API测试失败: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const clearViewer = () => {
  showPdf.value = false
  showApiResponse.value = false
  apiResponseData.value = null
  
  if (pdfBlobUrl.value) {
    URL.revokeObjectURL(pdfBlobUrl.value)
    pdfBlobUrl.value = ''
  }
  
  setStatus('已清空显示', 'info')
}

const onPdfLoad = () => {
  console.log('PDF iframe加载完成')
}

// 清理资源
onUnmounted(() => {
  if (pdfBlobUrl.value) {
    URL.revokeObjectURL(pdfBlobUrl.value)
  }
})

// 初始化
setStatus('Vue PDF查看器已就绪，请确保代理服务器运行在端口3003', 'info')
</script>

<style scoped>
.pdf-viewer {
  width: 100%;
}

.viewer-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.viewer-card h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 1.8rem;
}

.info-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-section h3 {
  color: #495057;
  margin-bottom: 1rem;
}

.features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.feature-tag {
  background: #28a745;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.url-section {
  margin-bottom: 2rem;
}

.input-group {
  margin-bottom: 1rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.input-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #667eea;
}

.preset-urls {
  padding: 1rem;
  background: #f1f3f4;
  border-radius: 8px;
}

.preset-urls h4 {
  margin-bottom: 0.75rem;
  color: #495057;
}

.preset-btn {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.preset-btn:hover {
  background: #138496;
}

.controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.controls button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-clear {
  background: #dc3545;
  color: white;
}

.btn-clear:hover:not(:disabled) {
  background: #c82333;
}

.controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.status {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.status-info {
  background: #d1ecf1;
  color: #0c5460;
}

.status-success {
  background: #d4edda;
  color: #155724;
}

.status-error {
  background: #f8d7da;
  color: #721c24;
}

.status-loading {
  background: #fff3cd;
  color: #856404;
}

.api-response {
  background: #f1f3f4;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.api-response h4 {
  margin-bottom: 0.75rem;
  color: #495057;
}

.api-response pre {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  border: 1px solid #dee2e6;
}

.pdf-container {
  width: 100%;
  height: 600px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}

.pdf-container iframe {
  width: 100%;
  height: 100%;
}

.placeholder {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.placeholder-content h3 {
  margin-bottom: 1rem;
  color: #495057;
}

.placeholder-content ol {
  text-align: left;
  max-width: 400px;
  margin: 0 auto;
}

.placeholder-content li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .viewer-card {
    padding: 1rem;
  }
  
  .features {
    justify-content: center;
  }
  
  .controls {
    flex-direction: column;
    align-items: center;
  }
  
  .controls button {
    width: 100%;
    max-width: 300px;
  }
  
  .pdf-container {
    height: 400px;
  }
}
</style>