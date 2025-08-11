<template>
  <div class="pdf-viewer-container">
    <div class="pdf-toolbar">
      <el-button-group>
        <el-button @click="prevPage" :disabled="pageNum <= 1">上一页</el-button>
        <el-button @click="nextPage" :disabled="pageNum >= pageCount">下一页</el-button>
      </el-button-group>

      <div class="page-indicator">
        <el-input-number
          v-model="pageNum"
          :min="1"
          :max="pageCount"
          size="small"
          controls-position="right"
          @change="handlePageChange"
        />
        / {{ pageCount }}
      </div>

      <el-button-group>
        <el-button @click="zoomOut">缩小</el-button>
        <el-button @click="zoomIn">放大</el-button>
      </el-button-group>
    </div>
    <div v-if="loading" class="loading-overlay">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
    </div>
    <div class="pdf-content-container">
      <div v-if="errorState" class="error-container">
        <el-icon :size="40"><CircleCloseFilled /></el-icon>
        <p>无法加载 PDF</p>
        <p class="error-message">{{ errorState }}</p>
      </div>
      <canvas v-show="!errorState" ref="pdfCanvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { ElButton, ElButtonGroup, ElInputNumber, ElIcon } from 'element-plus';
import { Loading, CircleCloseFilled } from '@element-plus/icons-vue';
// 待环境修复后取消注释
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

const pdfCanvas = ref<HTMLCanvasElement | null>(null);
const pdfDoc = ref<PDFDocumentProxy | null>(null);
const pageNum = ref(1);
const pageCount = ref(0);
const loading = ref(false);
const scale = ref(1.5);
const errorState = ref<string | null>(null);

interface Props {
  fileUrl: string;
  // 待环境修复后，workerSrc 将从 vite.config.ts 自动处理
  // workerSrc: string;
}

const props = defineProps<Props>();

onMounted(() => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
  loadPdfDocument();
});

watch(() => props.fileUrl, (newUrl) => {
  if (newUrl) {
    loadPdfDocument();
  }
});

const loadPdfDocument = async () => {
  if (!props.fileUrl) return;

  loading.value = true;
  pdfDoc.value = null; // 重置
  pageCount.value = 0;
  pageNum.value = 0;
  errorState.value = null;

  try {
    // 待环境修复后取消注释
    const doc = await pdfjsLib.getDocument(props.fileUrl).promise;
    pdfDoc.value = doc;
    pageCount.value = doc.numPages;
    pageNum.value = 1;
    renderPage(pageNum.value);

  } catch (error: any) {
    console.error('PDF 加载失败:', error);
    errorState.value = error.message || '加载 PDF 文件时发生未知错误。';
  } finally {
    loading.value = false;
  }
};

const renderPage = async (num: number) => {
  if (!pdfCanvas.value) return;
  
  if (!pdfDoc.value) return;

  try {
    const page = await pdfDoc.value.getPage(num);
    const viewport = page.getViewport({ scale: scale.value });
    const canvasContext = pdfCanvas.value.getContext('2d');

    if (!canvasContext) return;

    pdfCanvas.value.height = viewport.height;
    pdfCanvas.value.width = viewport.width;

    const renderContext = {
      canvasContext,
      viewport,
      canvas: pdfCanvas.value,
    };
    await page.render(renderContext).promise;
  } catch (error) {
    console.error(`渲染第 ${num} 页失败:`, error);
  }
};

const prevPage = () => {
  if (pageNum.value > 1) {
    pageNum.value--;
    renderPage(pageNum.value);
  }
};

const nextPage = () => {
  if (pageNum.value < pageCount.value) {
    pageNum.value++;
    renderPage(pageNum.value);
  }
};

const handlePageChange = (currentValue: number | undefined) => {
  if (typeof currentValue === 'number' && currentValue >= 1 && currentValue <= pageCount.value) {
    pageNum.value = currentValue;
    renderPage(pageNum.value);
  }
};

const zoomIn = () => {
  scale.value += 0.2;
  renderPage(pageNum.value);
};

const zoomOut = () => {
  if (scale.value > 0.4) {
    scale.value -= 0.2;
    renderPage(pageNum.value);
  }
};

</script>

<style scoped>
.pdf-viewer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f5f5;
}

.pdf-toolbar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  padding: 8px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  flex-shrink: 0;
}

.page-indicator {
  display: flex;
  align-items: center;

  gap: 8px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.pdf-content-container {
  flex-grow: 1;
  overflow: auto;
  text-align: center;
  padding: 16px;
  position: relative;
}

.error-container {
  color: #f56c6c;
  text-align: center;
  padding-top: 100px;
}

.error-message {
  font-size: 14px;
  color: #909399;
}

canvas {
  border: 1px solid #ccc;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
</style>