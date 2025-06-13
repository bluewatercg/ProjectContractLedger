<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">仪表板</h2>
      <div class="header-actions">
        <el-tag v-if="loadTime" type="info" size="small">
          加载时间: {{ loadTime }}ms
        </el-tag>
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

          <!-- 统计卡片 -->
          <div class="card-grid" v-loading="loading">
            <div class="stat-card">
              <div class="stat-card-header">
                <span class="stat-card-title">总客户数</span>
                <el-icon class="stat-card-icon"><User /></el-icon>
              </div>
              <div class="stat-card-value">{{ stats?.customers?.total || 0 }}</div>
              <div class="stat-card-change">活跃客户: {{ stats?.customers?.active || 0 }}</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-header">
                <span class="stat-card-title">总合同数</span>
                <el-icon class="stat-card-icon"><Document /></el-icon>
              </div>
              <div class="stat-card-value">{{ stats?.contracts?.total || 0 }}</div>
              <div class="stat-card-change">执行中: {{ stats?.contracts?.active || 0 }}</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-header">
                <span class="stat-card-title">总收入</span>
                <el-icon class="stat-card-icon"><Money /></el-icon>
              </div>
              <div class="stat-card-value">¥{{ formatCurrency(stats?.summary?.totalRevenue || 0) }}</div>
              <div class="stat-card-change">已收: ¥{{ formatCurrency(stats?.summary?.paidAmount || 0) }}</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-header">
                <span class="stat-card-title">待收款</span>
                <el-icon class="stat-card-icon"><Tickets /></el-icon>
              </div>
              <div class="stat-card-value">¥{{ formatCurrency(stats?.summary?.unpaidAmount || 0) }}</div>
              <div class="stat-card-change">逾期: {{ stats?.invoices?.overdue || 0 }} 张</div>
            </div>
          </div>

          <!-- 快速操作 -->
          <div class="quick-actions">
            <h3>快速操作</h3>
            <div class="action-buttons">
              <el-button type="primary" @click="$router.push('/customers/create')">
                <el-icon><Plus /></el-icon>
                新建客户
              </el-button>
              <el-button type="success" @click="$router.push('/contracts/create')">
                <el-icon><Plus /></el-icon>
                新建合同
              </el-button>
              <el-button type="warning" @click="$router.push('/invoices/create')">
                <el-icon><Plus /></el-icon>
                新建发票
              </el-button>
              <el-button type="info" @click="$router.push('/payments/create')">
                <el-icon><Plus /></el-icon>
                新建支付
              </el-button>
            </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { statisticsApi } from '@/api'
import type { DashboardStats } from '@/api/types'

const router = useRouter()

// 状态
const loading = ref(false)
const stats = ref<DashboardStats>()
const loadTime = ref<number>()

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount)
}

// 获取统计数据
const fetchStats = async (useCache: boolean = true) => {
  try {
    loading.value = true
    const startTime = Date.now()

    const response = await statisticsApi.getDashboardStats(useCache)
    if (response.success) {
      stats.value = response.data

      const endTime = Date.now()
      loadTime.value = endTime - startTime
      console.log(`Dashboard loaded in ${loadTime.value}ms`)

      // 如果加载时间超过1秒，显示提示
      if (loadTime.value > 1000) {
        ElMessage.info(`数据加载完成 (${loadTime.value}ms)`)
      }
    } else {
      ElMessage.error(response.message || '获取统计数据失败')
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    ElMessage.error('获取统计数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 刷新数据（强制从服务器获取）
const refreshData = async () => {
  try {
    await statisticsApi.refreshDashboardStats()
    await fetchStats(false)
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('刷新数据失败')
  }
}



// 组件挂载时获取数据
onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
/* 使用全局页面样式，这里只定义Dashboard特有的样式 */

.card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stat-card-title {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.stat-card-icon {
  font-size: 24px;
  color: #409eff;
}

.stat-card-value {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.stat-card-change {
  font-size: 12px;
  color: #999;
}

.quick-actions {
  margin-top: 32px;
}

.quick-actions h3 {
  margin-bottom: 16px;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
