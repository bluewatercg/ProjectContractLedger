<template>
  <div class="pdf-preview-page">
    <div class="deprecated-notice">
      <h3>此页面已弃用</h3>
      <p>请使用新的PDF预览功能，将自动重定向...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 自动重定向到新的预览页面
onMounted(() => {
  // 如果有附件ID参数，转换并重定向
  const urlParam = route.query.url
  if (typeof urlParam === 'string' && urlParam.includes('attachmentId=')) {
    const match = urlParam.match(/attachmentId=(\d+)/)
    if (match) {
      const attachmentId = match[1]
      router.replace(`/simple-pdf-preview?attachmentId=${attachmentId}`)
      return
    }
  }
  
  // 如果无法解析，显示错误信息
  console.warn('Unable to parse PDF preview URL, showing deprecated notice')
})
</script>

<style scoped>
.pdf-preview-page {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}

.deprecated-notice {
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

.deprecated-notice h3 {
  color: #f56c6c;
  margin-bottom: 16px;
}

.deprecated-notice p {
  color: #666;
  margin: 0;
}
</style>
