import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 样式 - 按顺序加载：设计系统 -> Element Plus主题 -> 全局样式 -> 页面样式 -> 动画
import './styles/design-system.css'
import './styles/element-theme.css'
import './styles/index.css'
import './styles/page.css'
import './styles/animations.css'

// 创建应用实例
const app = createApp(App)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 挂载应用
app.mount('#app')
