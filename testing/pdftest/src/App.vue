<template>
  <div id="app">
    <header>
      <h1>📄 PDF Base64代理MVP</h1>
      <p>防IDM拦截的PDF预览系统 - Vue版</p>
    </header>
    
    <main>
      <PDFViewer />
    </main>
  </div>
</template>

<script setup>
import PDFViewer from './components/PDFViewer.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

header h1 {
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
}

header p {
  opacity: 0.9;
  font-size: 1.1rem;
}

main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  header {
    padding: 1rem;
  }
  
  header h1 {
    font-size: 1.8rem;
  }
  
  main {
    padding: 1rem;
  }
}
</style>