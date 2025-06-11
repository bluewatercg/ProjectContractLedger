import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RouteRecordRaw } from 'vue-router'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { requiresAuth: true, title: '仪表板' }
      },
      {
        path: 'customers',
        name: 'Customers',
        component: () => import('@/views/customers/CustomerList.vue'),
        meta: { requiresAuth: true, title: '客户管理' }
      },
      {
        path: 'customers/create',
        name: 'CustomerCreate',
        component: () => import('@/views/customers/CustomerForm.vue'),
        meta: { requiresAuth: true, title: '新建客户' }
      },
      {
        path: 'customers/:id',
        name: 'CustomerDetail',
        component: () => import('@/views/customers/CustomerDetail.vue'),
        meta: { requiresAuth: true, title: '客户详情' }
      },
      {
        path: 'customers/:id/edit',
        name: 'CustomerEdit',
        component: () => import('@/views/customers/CustomerForm.vue'),
        meta: { requiresAuth: true, title: '编辑客户' }
      },
      {
        path: 'contracts',
        name: 'Contracts',
        component: () => import('@/views/contracts/ContractList.vue'),
        meta: { requiresAuth: true, title: '合同管理' }
      },
      {
        path: 'contracts/create',
        name: 'ContractCreate',
        component: () => import('@/views/contracts/ContractForm.vue'),
        meta: { requiresAuth: true, title: '新建合同' }
      },
      {
        path: 'contracts/:id',
        name: 'ContractDetail',
        component: () => import('@/views/contracts/ContractDetail.vue'),
        meta: { requiresAuth: true, title: '合同详情' }
      },
      {
        path: 'contracts/:id/edit',
        name: 'ContractEdit',
        component: () => import('@/views/contracts/ContractForm.vue'),
        meta: { requiresAuth: true, title: '编辑合同' }
      },
      {
        path: 'invoices',
        name: 'Invoices',
        component: () => import('@/views/invoices/InvoiceList.vue'),
        meta: { requiresAuth: true, title: '发票管理' }
      },
      {
        path: 'invoices/create',
        name: 'InvoiceCreate',
        component: () => import('@/views/invoices/InvoiceForm.vue'),
        meta: { requiresAuth: true, title: '新建发票' }
      },
      {
        path: 'invoices/:id',
        name: 'InvoiceDetail',
        component: () => import('@/views/invoices/InvoiceDetail.vue'),
        meta: { requiresAuth: true, title: '发票详情' }
      },
      {
        path: 'invoices/:id/edit',
        name: 'InvoiceEdit',
        component: () => import('@/views/invoices/InvoiceForm.vue'),
        meta: { requiresAuth: true, title: '编辑发票' }
      },
      {
        path: 'payments',
        name: 'Payments',
        component: () => import('@/views/payments/PaymentList.vue'),
        meta: { requiresAuth: true, title: '支付管理' }
      },
      {
        path: 'payments/create',
        name: 'PaymentCreate',
        component: () => import('@/views/payments/PaymentForm.vue'),
        meta: { requiresAuth: true, title: '新建支付' }
      },
      {
        path: 'payments/:id',
        name: 'PaymentDetail',
        component: () => import('@/views/payments/PaymentDetail.vue'),
        meta: { requiresAuth: true, title: '支付详情' }
      },
      {
        path: 'payments/:id/edit',
        name: 'PaymentEdit',
        component: () => import('@/views/payments/PaymentForm.vue'),
        meta: { requiresAuth: true, title: '编辑支付' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { requiresAuth: true, title: '系统设置' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { requiresAuth: false, title: '页面不存在' }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 客户合同管理系统`
  }
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // 未登录，重定向到登录页
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // 检查token有效性
    const isValid = await authStore.checkTokenValidity()
    if (!isValid) {
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }
  
  // 如果已登录用户访问登录页，重定向到仪表板
  if (to.name === 'Login' && authStore.isAuthenticated) {
    next({ name: 'Dashboard' })
    return
  }
  
  next()
})

export default router
