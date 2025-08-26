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

          <!-- 提醒事项 -->
          <div class="reminders-section" v-loading="remindersLoading">
            <div class="section-header">
              <h3>待处理事项</h3>
              <div class="reminder-stats">
                <el-tag v-if="reminders" :type="getStatsTagType()" size="small">
                  共 {{ reminders.total }} 项
                </el-tag>
                <el-button size="small" @click="refreshReminders" :loading="remindersLoading">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </div>
            
            <div v-if="reminders && reminders.total > 0" class="reminders-content">
              <!-- 优先级统计 -->
              <div class="priority-summary">
                <div class="priority-item high" v-if="reminders.high > 0">
                  <el-icon><Warning /></el-icon>
                  <span>高优先级: {{ reminders.high }}</span>
                </div>
                <div class="priority-item medium" v-if="reminders.medium > 0">
                  <el-icon><InfoFilled /></el-icon>
                  <span>中优先级: {{ reminders.medium }}</span>
                </div>
                <div class="priority-item low" v-if="reminders.low > 0">
                  <el-icon><CircleCheck /></el-icon>
                  <span>低优先级: {{ reminders.low }}</span>
                </div>
              </div>

              <!-- 提醒列表 -->
              <div class="reminders-list">
                <!-- 履约类提醒 -->
                <div class="category-section" v-if="reminders.items.filter(item => item.category === 'fulfillment').length > 0">
                  <h4 class="category-title">
                    <el-icon><Calendar /></el-icon>
                    合同履约类 ({{ reminders.items.filter(item => item.category === 'fulfillment').length }})
                  </h4>
                  <div 
                    v-for="item in reminders.items.filter(item => item.category === 'fulfillment')" 
                    :key="`${item.type}-${item.id}`"
                    class="reminder-item"
                    :class="`priority-${item.priority}`"
                    @click="handleReminderClick(item)"
                  >
                    <div class="reminder-icon">
                      <el-icon v-if="item.type === 'contract_renewal'"><Calendar /></el-icon>
                      <el-icon v-else-if="item.type === 'contract_fulfillment'"><Clock /></el-icon>
                    </div>
                    
                    <div class="reminder-content">
                      <div class="reminder-title">{{ item.title }}</div>
                      <div class="reminder-description">{{ item.description }}</div>
                      <div class="reminder-meta">
                        <span v-if="item.customerName" class="customer-name">
                          <el-icon><User /></el-icon>
                          {{ item.customerName }}
                        </span>
                        <span v-if="item.amount" class="amount">
                          <el-icon><Money /></el-icon>
                          ¥{{ formatCurrency(item.amount) }}
                        </span>
                        <span v-if="item.daysUntilDue !== undefined" class="days-due">
                          <el-icon><Clock /></el-icon>
                          {{ item.daysUntilDue }} 天
                        </span>
                      </div>
                    </div>
                    
                    <div class="reminder-actions">
                      <el-button size="small" type="primary" @click.stop="handleReminderAction(item)">
                        处理
                      </el-button>
                      <el-button size="small" @click.stop="markAsHandled(item)">
                        忽略
                      </el-button>
                    </div>
                  </div>
                </div>

                <!-- 开票类提醒 -->
                <div class="category-section" v-if="reminders.items.filter(item => item.category === 'invoice').length > 0">
                  <h4 class="category-title">
                    <el-icon><Document /></el-icon>
                    财务开票类 ({{ reminders.items.filter(item => item.category === 'invoice').length }})
                  </h4>
                  <div 
                    v-for="item in reminders.items.filter(item => item.category === 'invoice')" 
                    :key="`${item.type}-${item.id}`"
                    class="reminder-item"
                    :class="`priority-${item.priority}`"
                    @click="handleReminderClick(item)"
                  >
                    <div class="reminder-icon">
                      <el-icon><Document /></el-icon>
                    </div>
                    
                    <div class="reminder-content">
                      <div class="reminder-title">{{ item.title }}</div>
                      <div class="reminder-description">{{ item.description }}</div>
                      <div class="reminder-meta">
                        <span v-if="item.customerName" class="customer-name">
                          <el-icon><User /></el-icon>
                          {{ item.customerName }}
                        </span>
                        <span v-if="item.amount" class="amount">
                          <el-icon><Money /></el-icon>
                          ¥{{ formatCurrency(item.amount) }}
                        </span>
                        <span v-if="item.daysUntilDue !== undefined" class="days-due">
                          <el-icon><Clock /></el-icon>
                          {{ item.daysUntilDue }} 天
                        </span>
                      </div>
                    </div>
                    
                    <div class="reminder-actions">
                      <el-button size="small" type="primary" @click.stop="handleReminderAction(item)">
                        处理
                      </el-button>
                      <el-button size="small" @click.stop="markAsHandled(item)">
                        忽略
                      </el-button>
                    </div>
                  </div>
                </div>

                <!-- 收款类提醒 -->
                <div class="category-section" v-if="reminders.items.filter(item => item.category === 'payment').length > 0">
                  <h4 class="category-title">
                    <el-icon><Money /></el-icon>
                    财务收款类 ({{ reminders.items.filter(item => item.category === 'payment').length }})
                  </h4>
                  <div 
                    v-for="item in reminders.items.filter(item => item.category === 'payment')" 
                    :key="`${item.type}-${item.id}`"
                    class="reminder-item"
                    :class="`priority-${item.priority}`"
                    @click="handleReminderClick(item)"
                  >
                    <div class="reminder-icon">
                      <el-icon><Money /></el-icon>
                    </div>
                    
                    <div class="reminder-content">
                      <div class="reminder-title">{{ item.title }}</div>
                      <div class="reminder-description">{{ item.description }}</div>
                      <div class="reminder-meta">
                        <span v-if="item.customerName" class="customer-name">
                          <el-icon><User /></el-icon>
                          {{ item.customerName }}
                        </span>
                        <span v-if="item.amount" class="amount">
                          <el-icon><Money /></el-icon>
                          ¥{{ formatCurrency(item.amount) }}
                        </span>
                        <span v-if="item.daysUntilDue !== undefined" class="days-due">
                          <el-icon><Clock /></el-icon>
                          {{ item.daysUntilDue }} 天
                        </span>
                      </div>
                    </div>
                    
                    <div class="reminder-actions">
                      <el-button size="small" type="primary" @click.stop="handleReminderAction(item)">
                        处理
                      </el-button>
                      <el-button size="small" @click.stop="markAsHandled(item)">
                        忽略
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else-if="reminders && reminders.total === 0" class="no-reminders">
              <el-empty description="暂无待处理事项" :image-size="100" />
            </div>
          </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  User, 
  Document, 
  Money, 
  Tickets, 
  Plus, 
  Refresh, 
  Warning, 
  InfoFilled, 
  CircleCheck, 
  Calendar, 
  Clock 
} from '@element-plus/icons-vue'
import { statisticsApi } from '@/api'
import { reminderApi, type ReminderItem, type ReminderSummary } from '@/api/reminder'
import type { DashboardStats } from '@/api/types'

const router = useRouter()

// 状态
const loading = ref(false)
const remindersLoading = ref(false)
const stats = ref<DashboardStats>()
const reminders = ref<ReminderSummary>()
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

// 获取提醒事项
const fetchReminders = async () => {
  try {
    remindersLoading.value = true
    const response = await reminderApi.getAllReminders()
    if (response.success) {
      reminders.value = response.data
    } else {
      ElMessage.error(response.message || '获取提醒事项失败')
    }
  } catch (error) {
    console.error('Failed to fetch reminders:', error)
    ElMessage.error('获取提醒事项失败，请稍后重试')
  } finally {
    remindersLoading.value = false
  }
}

// 刷新提醒事项
const refreshReminders = async () => {
  await fetchReminders()
  ElMessage.success('提醒事项已刷新')
}

// 获取统计标签类型
const getStatsTagType = () => {
  if (!reminders.value) return 'info'
  if (reminders.value.high > 0) return 'danger'
  if (reminders.value.medium > 0) return 'warning'
  return 'success'
}

// 处理提醒点击
const handleReminderClick = (item: ReminderItem) => {
  if (item.actionUrl) {
    router.push(item.actionUrl)
  }
}

// 处理提醒操作
const handleReminderAction = (item: ReminderItem) => {
  if (item.actionUrl) {
    router.push(item.actionUrl)
  }
}

// 标记为已处理
const markAsHandled = async (item: ReminderItem) => {
  try {
    const result = await ElMessageBox.confirm(
      `确定要忽略这个提醒吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    if (result === 'confirm') {
      const response = await reminderApi.markAsHandled(item.id, item.type)
      if (response.success) {
        ElMessage.success('已标记为已处理')
        await fetchReminders() // 刷新提醒列表
      } else {
        ElMessage.error(response.message || '操作失败')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}



// 组件挂载时获取数据
onMounted(() => {
  fetchStats()
  fetchReminders()
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
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
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

/* 提醒区域样式 */
.reminders-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.reminder-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.priority-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.priority-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

.priority-item.high {
  color: #f56c6c;
}

.priority-item.medium {
  color: #e6a23c;
}

.priority-item.low {
  color: #67c23a;
}

.reminders-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.category-section {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.category-title {
  margin: 0;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-section .reminder-item {
  margin: 0;
  border: none;
  border-bottom: 1px solid #f0f2f5;
  border-radius: 0;
}

.category-section .reminder-item:last-child {
  border-bottom: none;
}

.reminder-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.reminder-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.reminder-item.priority-high {
  border-left: 4px solid #f56c6c;
}

.reminder-item.priority-medium {
  border-left: 4px solid #e6a23c;
}

.reminder-item.priority-low {
  border-left: 4px solid #67c23a;
}

.reminder-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 18px;
  color: #409eff;
}

.reminder-content {
  flex: 1;
  min-width: 0;
}

.reminder-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  line-height: 1.4;
}

.reminder-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.4;
}

.reminder-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.reminder-meta > span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reminder-actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.no-reminders {
  text-align: center;
  padding: 40px 20px;
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .priority-summary {
    flex-direction: column;
    gap: 8px;
  }
  
  .reminder-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .reminder-icon {
    margin-right: 0;
  }
  
  .reminder-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
