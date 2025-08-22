<template>
  <div class="pdf-preview-page">
    <EmbedPdfViewer v-if="pdfUrl" :url="pdfUrl" />
    <div v-else class="loading-container">
      <p v-if="errorMessage">{{ errorMessage }}</p>
      <p v-else>正在加载预览...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import EmbedPdfViewer from '@/components/EmbedPdfViewer.vue';

const route = useRoute();
const pdfUrl = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

onMounted(() => {
  const urlFromQuery = route.query.url;
  if (typeof urlFromQuery === 'string' && urlFromQuery) {
    // 解码 URL，以防 URL 本身被编码过
    pdfUrl.value = decodeURIComponent(urlFromQuery);
  } else {
    console.error('No PDF URL provided in the query string.');
    errorMessage.value = '错误：未提供有效的 PDF 文件链接。';
  }
});
</script>

<style scoped>
.pdf-preview-page {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden; /* 确保预览器占满整个屏幕 */
}

.pdf-preview-page > :first-child {
    height: 100vh; /* 让 EmbedPdfViewer 组件占满屏幕高度 */
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
  color: #888;
}
</style>
