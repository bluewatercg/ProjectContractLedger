import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  // 后端服务地址优先级: 环境变量 > 默认地址
  // 兼顾本地开发 (DEFAULT_PORT) 和 生产部署 (BACKEND_HOST, BACKEND_HOST_PORT)
  const host = env.BACKEND_HOST || 'localhost'
  const port = env.BACKEND_HOST_PORT || env.BACKEND_PORT || 8080
  const target = env.VITE_API_TARGET || `http://${host}:${port}`

  return {
    plugins: [
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
        imports: ['vue', 'vue-router', 'pinia'],
        dts: true
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: true
      }),
      viteStaticCopy({
        targets: [
          {
            src: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
            dest: 'assets'
          }
        ]
      })
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: 8000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: target,
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets'
    }
  }
})
