<template>
  <div ref="pdfContainer" class="embed-pdf-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

// 定义 props
const props = defineProps({
  url: {
    type: String,
    required: true,
  },
});

const pdfContainer = ref<HTMLDivElement | null>(null);
let pdfInstance: any = null;

// 声明一个全局类型，避免 TypeScript 报错
declare global {
  interface Window {
    EmbedPDF: any;
  }
}

// 动态加载外部脚本
const loadScript = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    // 如果脚本已经加载，直接返回
    if (window.EmbedPDF) {
      return resolve(window.EmbedPDF);
    }

    const script = document.createElement('script');
    script.src = 'https://snippet.embedpdf.com/embedpdf.js';
    script.type = 'module';
    script.async = true;

    script.onload = () => {
      // 因为是 module 类型，它不会直接挂载到 window
      // 我们需要动态 import 来获取模块的导出
      import('https://snippet.embedpdf.com/embedpdf.js')
        .then(module => {
          window.EmbedPDF = module.default; // 将模块默认导出缓存到 window
          resolve(window.EmbedPDF);
        })
        .catch(err => {
            console.error('Dynamic import of EmbedPDF failed:', err);
            reject(err);
        });
    };

    script.onerror = (err) => {
        console.error('Failed to load EmbedPDF script:', err);
        reject(new Error('Failed to load EmbedPDF script.'));
    };
    
    document.head.appendChild(script);
  });
};


// 初始化 PDF 预览
const initPdfViewer = async () => {
  if (pdfContainer.value && props.url) {
    try {
      const EmbedPDF = await loadScript();

      // 清理旧实例的 DOM
      if (pdfContainer.value) {
        pdfContainer.value.innerHTML = '';
      }
      
      pdfInstance = await EmbedPDF.init({
        type: 'container',
        target: pdfContainer.value,
        src: props.url,
      });

    } catch (error) {
      console.error('Failed to initialize EmbedPDF:', error);
      if (pdfContainer.value) {
        pdfContainer.value.innerText = 'PDF 预览加载失败。';
      }
    }
  }
};

onMounted(() => {
  initPdfViewer();
});

// 监听 URL 变化
watch(() => props.url, (newUrl) => {
  if (newUrl && pdfContainer.value) {
    initPdfViewer();
  }
}, { immediate: false }); // 初始加载由 onMounted 处理

onUnmounted(() => {
    // 销毁时清理容器
    if (pdfContainer.value) {
        pdfContainer.value.innerHTML = '';
    }
    pdfInstance = null;
});

</script>

<style scoped>
.embed-pdf-container {
  width: 100%;
  height: 75vh;
  border: 1px solid #eee;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #888;
}
</style>
