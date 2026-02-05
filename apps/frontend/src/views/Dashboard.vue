<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">仪表板</h2>
      <div class="header-actions">
        <el-select
          v-model="selectedYear"
          @change="handleYearChange"
          size="default"
          style="width: 120px; margin-right: 12px"
        >
          <el-option
            v-for="year in availableYears"
            :key="year"
            :label="`${year}年`"
            :value="year"
          />
        </el-select>
        <el-tag v-if="loadTime" type="info" size="small">
          加载时间: {{ loadTime }}ms
        </el-tag>
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 财务概览瀑布流 -->
    <div class="financial-section" v-loading="loading">
      <div class="section-header">
        <h3>财务状况总览 ({{ selectedYear }}年)</h3>
        <el-tooltip
          content="展示从合同签订到开票、再到最终收款的完整价值流转"
          placement="top"
        >
          <el-icon class="info-icon"><InfoFilled /></el-icon>
        </el-tooltip>
      </div>

      <div class="financial-funnel">
        <!-- 1. 合同总额 -->
        <div class="funnel-item animate-slide-in-up">
          <div class="funnel-label">签署合同总额</div>
          <div class="funnel-value">
            ¥{{ formatCurrency(stats?.summary?.totalRevenue || 0) }}
          </div>
          <div class="funnel-desc">
            共 {{ stats?.contracts?.total || 0 }} 份合同
          </div>
          <div class="funnel-connector"></div>
        </div>

        <!-- 2. 已开票 -->
        <div class="funnel-itemHighlight animate-slide-in-up delay-100">
          <div class="funnel-label">已开发票金额</div>
          <div class="funnel-value">
            ¥{{ formatCurrency(stats?.summary?.invoicedAmount || 0) }}
          </div>
          <div class="funnel-progress">
            <el-progress
              :percentage="
                getPercentage(
                  stats?.summary?.invoicedAmount,
                  stats?.summary?.totalRevenue,
                )
              "
              :format="
                () =>
                  `${getPercentage(stats?.summary?.invoicedAmount, stats?.summary?.totalRevenue)}% 开票率`
              "
              stroke-width="12"
            />
          </div>
          <div class="funnel-connector"></div>
        </div>

        <!-- 3. 已回款 -->
        <div class="funnel-itemSuccess animate-slide-in-up delay-200">
          <div class="funnel-label">已实际收款</div>
          <div class="funnel-value">
            ¥{{ formatCurrency(stats?.summary?.paidAmount || 0) }}
          </div>
          <div class="funnel-progress">
            <el-progress
              :percentage="
                getPercentage(
                  stats?.summary?.paidAmount,
                  stats?.summary?.invoicedAmount,
                )
              "
              :format="
                () =>
                  `${getPercentage(stats?.summary?.paidAmount, stats?.summary?.invoicedAmount)}% 回款率`
              "
              stroke-width="12"
              status="success"
            />
          </div>
        </div>
      </div>

      <div class="financial-details-grid">
        <div class="detail-card warning">
          <div class="detail-info">
            <span class="detail-label">待开票余额</span>
            <span class="detail-value"
              >¥{{
                formatCurrency(stats?.summary?.uninvoicedAmount || 0)
              }}</span
            >
          </div>
          <el-icon class="detail-icon"><Document /></el-icon>
        </div>

        <div class="detail-card danger">
          <div class="detail-info">
            <span class="detail-label">待收款 (应收账款)</span>
            <span class="detail-value"
              >¥{{ formatCurrency(stats?.summary?.unpaidAmount || 0) }}</span
            >
            <span class="detail-sub" v-if="stats?.invoices?.overdue > 0">
              🔴 {{ stats?.invoices?.overdue }} 张发票已逾期
            </span>
          </div>
          <el-icon class="detail-icon"><Money /></el-icon>
        </div>

        <div class="detail-card info">
          <div class="detail-info">
            <span class="detail-label">活跃客户数</span>
            <span class="detail-value">{{
              stats?.summary?.activeCustomers || 0
            }}</span>
          </div>
          <el-icon class="detail-icon"><User /></el-icon>
        </div>

        <div class="detail-card primary">
          <div class="detail-info">
            <span class="detail-label">执行中合同</span>
            <span class="detail-value">{{
              stats?.summary?.activeContracts || 0
            }}</span>
          </div>
          <el-icon class="detail-icon"><Tickets /></el-icon>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-row" v-loading="loading">
      <div class="chart-container large">
        <div class="chart-header">
          <h3>收入与收款趋势 - {{ selectedYear }}</h3>
        </div>
        <div ref="revenueTrendChart" class="chart-box"></div>
      </div>

      <div class="chart-container small">
        <div class="chart-header">
          <h3>发票状态分布 - {{ selectedYear }}</h3>
        </div>
        <div ref="invoiceStatusChart" class="chart-box"></div>
      </div>
    </div>

    <div class="charts-row" v-loading="loading">
      <div class="chart-container medium">
        <div class="chart-header">
          <h3>核心客户贡献 (Top 5) - {{ selectedYear }}</h3>
        </div>
        <div ref="customerContributionChart" class="chart-box"></div>
      </div>

      <div class="chart-container medium">
        <div class="chart-header">
          <h3>合同状态分布 - {{ selectedYear }}</h3>
        </div>
        <div ref="contractStatusChart" class="chart-box"></div>
      </div>
    </div>

    <!-- 账龄分析区域 - 轻量现代化 -->
    <div class="aging-section" v-loading="loading">
      <div class="section-header">
        <div class="header-left">
          <el-icon class="section-icon"><TrendCharts /></el-icon>
          <h3>应收账款账龄分析</h3>
        </div>
        <el-tooltip
          content="按逾期时间分析未收回的款项，帮助识别风险"
          placement="top"
        >
          <el-icon class="info-icon"><InfoFilled /></el-icon>
        </el-tooltip>
      </div>

      <div v-if="agingData" class="aging-content">
        <!-- 汇总统计卡片 - 简化版 -->
        <div class="aging-summary-row">
          <div class="summary-card primary">
            <div class="summary-header">
              <el-icon class="summary-icon"><Money /></el-icon>
              <span class="summary-label">总应收账款</span>
            </div>
            <div class="summary-value">
              ¥{{ formatCurrency(agingData.totalUnpaid || 0) }}
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-header">
              <el-icon class="summary-icon"><Document /></el-icon>
              <span class="summary-label">未付发票数</span>
            </div>
            <div class="summary-value">
              {{ agingData.totalInvoices || 0 }} <span class="unit">张</span>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-header">
              <el-icon class="summary-icon"><User /></el-icon>
              <span class="summary-label">涉及客户</span>
            </div>
            <div class="summary-value">
              {{ agingData.totalCustomers || 0 }} <span class="unit">个</span>
            </div>
          </div>
        </div>

        <!-- 账龄分布列表 - 简化版 -->
        <div class="aging-buckets">
          <div
            v-for="bucket in agingData.summary"
            :key="bucket.bucket"
            class="bucket-row"
            :class="'risk-' + bucket.riskLevel"
          >
            <div class="bucket-header">
              <div class="bucket-info">
                <span
                  class="risk-indicator"
                  :class="'risk-' + bucket.riskLevel"
                ></span>
                <span class="bucket-name">{{ bucket.bucketLabel }}</span>
                <span class="bucket-count">{{ bucket.invoiceCount }} 张</span>
              </div>
              <div class="bucket-amount">
                <span class="amount">¥{{ formatCurrency(bucket.amount) }}</span>
                <span class="percentage"
                  >{{ bucket.percentage.toFixed(1) }}%</span
                >
              </div>
            </div>

            <div class="bucket-progress">
              <div
                class="progress-bar"
                :class="'risk-' + bucket.riskLevel"
                :style="{ width: bucket.percentage + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="no-aging-data">
        <el-empty description="暂无应收账款数据" :image-size="100" />
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

    <!-- 合同续签提醒 - 独立区域 -->
    <div class="renewal-section" v-loading="remindersLoading">
      <div class="section-header">
        <h3>
          <el-icon class="renewal-icon"><Calendar /></el-icon>
          合同续签提醒
        </h3>
        <div class="reminder-stats">
          <el-tag
            v-if="renewalReminders.length > 0"
            type="warning"
            size="small"
          >
            {{ renewalReminders.length }} 份合同即将到期
          </el-tag>
          <el-tag v-else type="success" size="small"> 暂无需续签合同 </el-tag>
        </div>
      </div>

      <div v-if="renewalReminders.length > 0" class="renewal-list">
        <div
          v-for="item in renewalReminders"
          :key="`renewal-${item.id}`"
          class="renewal-item"
          :class="`priority-${item.priority}`"
          @click="handleReminderClick(item)"
        >
          <div
            class="renewal-countdown"
            :class="getCountdownClass(item.daysUntilDue)"
          >
            <span class="countdown-number">{{ item.daysUntilDue }}</span>
            <span class="countdown-label">天后到期</span>
          </div>

          <div class="renewal-content">
            <div class="renewal-title">{{ item.contractNumber }}</div>
            <div class="renewal-customer">
              <el-icon><User /></el-icon>
              {{ item.customerName }}
            </div>
            <div class="renewal-amount">
              合同金额: ¥{{ formatCurrency(item.amount || 0) }}
            </div>
          </div>

          <div class="renewal-actions">
            <el-button
              size="small"
              type="warning"
              @click.stop="handleReminderAction(item)"
            >
              <el-icon><Refresh /></el-icon>
              联系续签
            </el-button>
            <el-button size="small" @click.stop="markAsHandled(item)">
              忽略
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="no-renewals">
        <el-empty description="近期无需续签的合同" :image-size="80" />
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
          <el-button
            size="small"
            @click="refreshReminders"
            :loading="remindersLoading"
          >
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
          <div
            class="category-section"
            v-if="
              reminders.items.filter(
                (item) =>
                  item.category === 'fulfillment' &&
                  item.type !== 'contract_renewal',
              ).length > 0
            "
          >
            <h4 class="category-title">
              <el-icon><Calendar /></el-icon>
              合同履约类 ({{
                reminders.items.filter(
                  (item) =>
                    item.category === "fulfillment" &&
                    item.type !== "contract_renewal",
                ).length
              }})
            </h4>
            <div
              v-for="item in reminders.items.filter(
                (item) =>
                  item.category === 'fulfillment' &&
                  item.type !== 'contract_renewal',
              )"
              :key="`${item.type}-${item.id}`"
              class="reminder-item"
              :class="`priority-${item.priority}`"
              @click="handleReminderClick(item)"
            >
              <div class="reminder-icon">
                <el-icon v-if="item.type === 'contract_renewal'"
                  ><Calendar
                /></el-icon>
                <el-icon v-else-if="item.type === 'contract_fulfillment'"
                  ><Clock
                /></el-icon>
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
                <el-button
                  size="small"
                  type="primary"
                  @click.stop="handleReminderAction(item)"
                >
                  处理
                </el-button>
                <el-button size="small" @click.stop="markAsHandled(item)">
                  忽略
                </el-button>
              </div>
            </div>
          </div>

          <!-- 开票类提醒 -->
          <div
            class="category-section"
            v-if="
              reminders.items.filter((item) => item.category === 'invoice')
                .length > 0
            "
          >
            <h4 class="category-title">
              <el-icon><Document /></el-icon>
              财务开票类 ({{
                reminders.items.filter((item) => item.category === "invoice")
                  .length
              }})
            </h4>
            <div
              v-for="item in reminders.items.filter(
                (item) => item.category === 'invoice',
              )"
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
                <el-button
                  size="small"
                  type="primary"
                  @click.stop="handleReminderAction(item)"
                >
                  处理
                </el-button>
                <el-button size="small" @click.stop="markAsHandled(item)">
                  忽略
                </el-button>
              </div>
            </div>
          </div>

          <!-- 收款类提醒 -->
          <div
            class="category-section"
            v-if="
              reminders.items.filter((item) => item.category === 'payment')
                .length > 0
            "
          >
            <h4 class="category-title">
              <el-icon><Money /></el-icon>
              财务收款类 ({{
                reminders.items.filter((item) => item.category === "payment")
                  .length
              }})
            </h4>
            <div
              v-for="item in reminders.items.filter(
                (item) => item.category === 'payment',
              )"
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
                <el-button
                  size="small"
                  type="primary"
                  @click.stop="handleReminderAction(item)"
                >
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import * as echarts from "echarts";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
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
  Clock,
  TrendCharts,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled,
} from "@element-plus/icons-vue";
import { statisticsApi } from "@/api";
import {
  reminderApi,
  type ReminderItem,
  type ReminderSummary,
} from "@/api/reminder";
import type { DashboardStats } from "@/api/types";
import { useKitStore } from "@/stores/kit";
import {
  createModernLineChart,
  createModernBarChart,
  createModernPieChart,
  chartColors,
  formatCurrency as formatChartCurrency
} from '@/utils/chartTheme';

const router = useRouter();
const kitStore = useKitStore();

// 状态
const loading = ref(false);
const remindersLoading = ref(false);
const stats = ref<DashboardStats>();
const reminders = ref<ReminderSummary>();
const loadTime = ref<number>();
const selectedYear = ref<number>(new Date().getFullYear());
const availableYears = ref<number[]>([new Date().getFullYear()]);
const agingData = ref<any>();

// 图表相关状态
const revenueTrendChart = ref<HTMLElement>();
const invoiceStatusChart = ref<HTMLElement>();
const customerContributionChart = ref<HTMLElement>();
const contractStatusChart = ref<HTMLElement>();

let charts: echarts.ECharts[] = [];

// 计算属性：筛选出续签类提醒
const renewalReminders = computed(() => {
  if (!reminders.value?.items) return [];
  return reminders.value.items.filter(
    (item) => item.type === "contract_renewal",
  );
});

// 获取倒计时样式类
const getCountdownClass = (days: number | undefined) => {
  if (days === undefined) return "";
  if (days <= 7) return "urgent";
  if (days <= 30) return "warning";
  return "normal";
};

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("zh-CN").format(amount);
};

// 计算百分比
const getPercentage = (
  value: number | undefined,
  total: number | undefined,
) => {
  if (!value || !total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

// 获取统计数据
const fetchStats = async (useCache: boolean = true) => {
  try {
    loading.value = true;
    const startTime = Date.now();

    // 添加10秒超时，确保移动端不会一直loading
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("请求超时")), 10000);
    });

    const response = await Promise.race([
      statisticsApi.getDashboardStats(selectedYear.value, useCache),
      timeoutPromise,
    ]);

    if (response.success) {
      stats.value = response.data;

      const endTime = Date.now();
      loadTime.value = endTime - startTime;
      console.log(`Dashboard loaded in ${loadTime.value}ms`);

      // 如果加载时间超过1秒，显示提示
      if (loadTime.value > 1000) {
        ElMessage.info(`数据加载完成 (${loadTime.value}ms)`);
      }
    } else {
      ElMessage.error(response.message || "获取统计数据失败");
    }
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    if (error.message === "请求超时") {
      ElMessage.error("请求超时，请检查网络连接后重试");
    } else {
      ElMessage.error("获取统计数据失败，请稍后重试");
    }
  } finally {
    loading.value = false;
  }
};

// 刷新数据（强制从服务器获取）
const refreshData = async () => {
  try {
    await statisticsApi.refreshDashboardStats(selectedYear.value);
    await Promise.all([fetchStats(false), initAllCharts()]);
    ElMessage.success("数据已刷新");
  } catch (error) {
    ElMessage.error("刷新数据失败");
  }
};

const handleYearChange = async () => {
  await Promise.all([fetchStats(true), initAllCharts()]);
};

const fetchAvailableYears = async () => {
  try {
    const response = await statisticsApi.getAvailableYears();
    if (response.success) {
      availableYears.value = response.data;
    }
  } catch (error) {
    console.error("Failed to fetch available years:", error);
  }
};

// 获取账龄分析
const fetchAgingAnalysis = async () => {
  try {
    const response = await statisticsApi.getAgingAnalysis(selectedYear.value);
    if (response.success) {
      agingData.value = response.data;
    }
  } catch (error) {
    console.error("Failed to fetch aging analysis:", error);
    // 失败时不显示错误，只是不显示该模块
    agingData.value = null;
  }
};

// 初始化所有图表
const initAllCharts = async () => {
  await nextTick();
  charts.forEach((chart) => chart.dispose());
  charts = [];

  await Promise.all([
    initRevenueTrendChart(),
    initInvoiceStatusChart(),
    initCustomerContributionChart(),
    initContractStatusChart(),
  ]);
};

// 收入趋势图
const initRevenueTrendChart = async () => {
  if (!revenueTrendChart.value) return;

  const chart = echarts.init(revenueTrendChart.value);
  charts.push(chart);
  chart.showLoading();

  try {
    const res = await statisticsApi.getMonthlyRevenueTrend(selectedYear.value);
    if (res.success) {
      const data = res.data;
      const option = createModernLineChart({
        months: data.map((item) => item.monthName),
        series: [
          {
            name: '应收金额',
            data: data.map((item) => item.revenue),
            color: chartColors.primary[0]
          },
          {
            name: '实收金额',
            data: data.map((item) => item.payments),
            color: chartColors.primary[1]
          }
        ]
      });
      chart.setOption(option);
    }
  } finally {
    chart.hideLoading();
  }
};

// 发票状态图
const initInvoiceStatusChart = async () => {
  if (!invoiceStatusChart.value) return;
  const chart = echarts.init(invoiceStatusChart.value);
  charts.push(chart);
  chart.showLoading();

  try {
    const res = await statisticsApi.getInvoiceStatusDistribution(
      selectedYear.value,
    );
    if (res.success) {
      const data = res.data.map((item) => ({
        name: item.status,
        value: item.count,
      }));
      const option = createModernPieChart(data);
      chart.setOption(option);
    }
  } finally {
    chart.hideLoading();
  }
};

// 客户贡献图
const initCustomerContributionChart = async () => {
  if (!customerContributionChart.value) return;
  const chart = echarts.init(customerContributionChart.value);
  charts.push(chart);
  chart.showLoading();

  try {
    const res = await statisticsApi.getCustomerContribution(
      selectedYear.value,
      5,
    );
    if (res.success) {
      const data = res.data.sort((a, b) => a.total - b.total);
      const option = createModernBarChart({
        categories: data.map((item) => item.name),
        series: [
          {
            name: '贡献总额',
            data: data.map((item) => item.total),
            color: chartColors.primary[0]
          }
        ]
      });
      // 横向柱状图配置
      option.xAxis.type = 'value';
      option.yAxis = {
        type: 'category',
        data: data.map((item) => item.name),
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 12 },
        axisTick: { show: false }
      };
      chart.setOption(option);
    }
  } finally {
    chart.hideLoading();
  }
};

// 合同状态图
const initContractStatusChart = async () => {
  if (!contractStatusChart.value) return;
  const chart = echarts.init(contractStatusChart.value);
  charts.push(chart);
  chart.showLoading();

  try {
    const res = await statisticsApi.getContractStatusDistribution(
      selectedYear.value,
    );
    if (res.success) {
      const data = res.data.map((item) => ({
        name: item.status,
        value: item.count,
      }));
      const option = createModernPieChart(data);
      chart.setOption(option);
    }
  } finally {
    chart.hideLoading();
  }
};

// 监听窗口大小变化
const handleResize = () => {
  charts.forEach((chart) => chart.resize());
};

// 获取提醒事项
const fetchReminders = async () => {
  try {
    remindersLoading.value = true;
    const response = await reminderApi.getAllReminders();
    if (response.success) {
      reminders.value = response.data;
    } else {
      ElMessage.error(response.message || "获取提醒事项失败");
    }
  } catch (error) {
    console.error("Failed to fetch reminders:", error);
    ElMessage.error("获取提醒事项失败，请稍后重试");
  } finally {
    remindersLoading.value = false;
  }
};

// 刷新提醒事项
const refreshReminders = async () => {
  await fetchReminders();
  ElMessage.success("提醒事项已刷新");
};

// 获取统计标签类型
const getStatsTagType = () => {
  if (!reminders.value) return "info";
  if (reminders.value.high > 0) return "danger";
  if (reminders.value.medium > 0) return "warning";
  return "success";
};

// 处理提醒点击
const handleReminderClick = (item: ReminderItem) => {
  if (item.actionUrl) {
    router.push(item.actionUrl);
  }
};

// 处理提醒操作
const handleReminderAction = (item: ReminderItem) => {
  if (item.actionUrl) {
    router.push(item.actionUrl);
  }
};

// 标记为已处理
const markAsHandled = async (item: ReminderItem) => {
  try {
    const result = await ElMessageBox.confirm(
      `确定要忽略这个提醒吗？`,
      "确认操作",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    if (result === "confirm") {
      const response = await reminderApi.markAsHandled(item.id, item.type);
      if (response.success) {
        ElMessage.success("已标记为已处理");
        await fetchReminders(); // 刷新提醒列表
      } else {
        ElMessage.error(response.message || "操作失败");
      }
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("操作失败");
    }
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchAvailableYears();
  fetchStats();
  fetchReminders();
  fetchAgingAnalysis();
  initAllCharts();
  window.addEventListener("resize", handleResize);
});

// 监听套账变化，自动刷新数据
watch(
  () => kitStore.currentKitId,
  async (newKitId, oldKitId) => {
    // 只在套账真正变化时刷新（避免初始化时触发）
    if (newKitId !== oldKitId && oldKitId !== null && newKitId !== null) {
      console.log(
        `Kit changed from ${oldKitId} to ${newKitId}, refreshing dashboard data...`,
      );

      try {
        // 清除缓存
        statisticsApi.clearCache(selectedYear.value);

        // 重新加载所有数据
        await Promise.all([
          fetchStats(false),
          fetchReminders(),
          fetchAgingAnalysis(),
          initAllCharts(),
        ]);

        ElMessage.success("数据已刷新");
      } catch (error) {
        console.error("Failed to refresh data after kit change:", error);
        ElMessage.error("数据刷新失败，请手动刷新");
      }
    }
  },
  { immediate: false },
);

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  charts.forEach((chart) => chart.dispose());
});
</script>

<style scoped>
/* 使用全局页面样式，这里只定义Dashboard特有的样式 */

.financial-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 32px;
}

.financial-section .section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.financial-section h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.financial-funnel {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 40px;
  position: relative;
}

.funnel-item,
.funnel-itemHighlight,
.funnel-itemSuccess {
  flex: 1;
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 2px solid #E2E8F0;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.funnel-item:hover,
.funnel-itemHighlight:hover,
.funnel-itemSuccess:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  border-color: #3B82F6;
}

.funnel-itemHighlight {
  background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
  border-color: #0EA5E9;
  border-left-width: 4px;
}

.funnel-itemSuccess {
  background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
  border-color: #22C55E;
  border-left-width: 4px;
}

.funnel-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.funnel-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
  line-height: 1.2;
}

.funnel-desc {
  font-size: 0.8125rem;
  color: #94a3b8;
  font-weight: 500;
}

.funnel-progress {
  margin-top: 12px;
}

.funnel-connector {
  position: absolute;
  right: -25px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, #3B82F6 0%, #0EA5E9 100%);
  z-index: 2;
}

.funnel-connector::after {
  content: "";
  position: absolute;
  right: 0;
  top: -4px;
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 8px solid #0EA5E9;
}

.funnel-connector::before {
  content: "";
  position: absolute;
  left: 0;
  top: -2px;
  width: 6px;
  height: 6px;
  background: #3B82F6;
  border-radius: 50%;
  animation: flowParticle 2s ease-in-out infinite;
}

@keyframes flowParticle {
  0%, 100% {
    transform: translateX(0);
    opacity: 1;
  }
  50% {
    transform: translateX(24px);
    opacity: 0.3;
  }
}

.financial-details-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.detail-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  background: white;
  border: 2px solid #F1F5F9;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.detail-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.detail-card.primary {
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border-color: #93C5FD;
}
.detail-card.success {
  background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
  border-color: #86EFAC;
}
.detail-card.warning {
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  border-color: #FDE68A;
}
.detail-card.danger {
  background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
  border-color: #FECACA;
}
.detail-card.info {
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
  border-color: #E2E8F0;
}

.detail-info {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 13px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 20px;
  font-weight: 700;
}

.detail-sub {
  font-size: 11px;
  margin-top: 4px;
  font-weight: normal;
  display: block;
}

.detail-icon {
  font-size: 24px;
  opacity: 0.4;
}

.info-icon {
  color: #94a3b8;
  cursor: help;
  font-size: 16px;
}

.charts-row {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-container.large {
  flex: 2;
}
.chart-container.medium {
  flex: 1;
}
.chart-container.small {
  flex: 1;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.chart-box {
  height: 300px;
  width: 100%;
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

/* 合同续签提醒区域样式 */
.renewal-section {
  background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.15);
  margin-bottom: 32px;
}

.renewal-section .section-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #856404;
}

.renewal-icon {
  color: #ffc107;
  font-size: 20px;
}

.renewal-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.renewal-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #ffe69c;
  cursor: pointer;
  transition: all 0.2s;
}

.renewal-item:hover {
  border-color: #ffc107;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);
  transform: translateY(-2px);
}

.renewal-item.priority-high {
  border-left: 4px solid #dc3545;
}

.renewal-item.priority-medium {
  border-left: 4px solid #ffc107;
}

.renewal-item.priority-low {
  border-left: 4px solid #28a745;
}

.renewal-countdown {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  flex-shrink: 0;
}

.renewal-countdown.urgent {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
}

.renewal-countdown.warning {
  background: linear-gradient(135deg, #ffc107, #e0a800);
  color: #212529;
}

.renewal-countdown.normal {
  background: linear-gradient(135deg, #28a745, #218838);
  color: white;
}

.countdown-number {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.countdown-label {
  font-size: 11px;
  margin-top: 4px;
}

.renewal-content {
  flex: 1;
  min-width: 0;
}

.renewal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.renewal-customer {
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.renewal-amount {
  font-size: 13px;
  color: #999;
}

.renewal-actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.no-renewals {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
}

@media (max-width: 1200px) {
  .financial-funnel {
    flex-wrap: wrap;
  }
  .funnel-item,
  .funnel-itemHighlight,
  .funnel-itemSuccess {
    flex: none;
    width: calc(50% - 10px);
    margin-bottom: 20px;
  }
  .funnel-connector {
    display: none;
  }

  .financial-details-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .funnel-item,
  .funnel-itemHighlight,
  .funnel-itemSuccess {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
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

  /* 续签区域响应式 */
  .renewal-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .renewal-countdown {
    width: 60px;
    height: 60px;
    margin-right: 0;
    margin-bottom: 8px;
  }

  .countdown-number {
    font-size: 22px;
  }

  .countdown-label {
    font-size: 10px;
  }

  .renewal-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}

/* 账龄分析区域 - 轻量现代化企业风格 */
.aging-section {
  background: white;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.aging-section .section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.aging-section .header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.aging-section .section-icon {
  font-size: 20px;
  color: #3b82f6;
}

.aging-section h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.aging-section .info-icon {
  color: #9ca3af;
  font-size: 16px;
  cursor: help;
  transition: color 0.2s;
}

.aging-section .info-icon:hover {
  color: #6b7280;
}

/* 汇总统计卡片行 */
.aging-summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  transition: all 0.2s ease;
}

.summary-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.summary-card.primary {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.summary-icon {
  font-size: 18px;
  color: #6b7280;
}

.summary-card.primary .summary-icon {
  color: #3b82f6;
}

.summary-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.summary-card.primary .summary-value {
  color: #1e40af;
}

.summary-value .unit {
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
  margin-left: 4px;
}

/* 账龄分布列表 */
.aging-buckets {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bucket-row {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 14px 16px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.bucket-row::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  transition: width 0.2s ease;
}

.bucket-row.risk-low::before {
  background: #10b981;
}

.bucket-row.risk-medium::before {
  background: #f59e0b;
}

.bucket-row.risk-high::before {
  background: #ef4444;
}

.bucket-row:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.bucket-row:hover::before {
  width: 4px;
}

.bucket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.bucket-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.risk-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.risk-indicator.risk-low {
  background: #10b981;
}

.risk-indicator.risk-medium {
  background: #f59e0b;
}

.risk-indicator.risk-high {
  background: #ef4444;
}

.bucket-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.bucket-count {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 10px;
}

.bucket-amount {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.bucket-amount .amount {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.bucket-amount .percentage {
  font-size: 13px;
  color: #6b7280;
  font-weight: 600;
}

.bucket-progress {
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}

.bucket-progress .progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.bucket-progress .progress-bar.risk-low {
  background: #10b981;
}

.bucket-progress .progress-bar.risk-medium {
  background: #f59e0b;
}

.bucket-progress .progress-bar.risk-high {
  background: #ef4444;
}

.no-aging-data {
  padding: 40px 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .aging-section {
    padding: 16px;
  }

  .aging-summary-row {
    grid-template-columns: 1fr;
  }

  .summary-value {
    font-size: 20px;
  }

  .bucket-amount .amount {
    font-size: 16px;
  }

  .bucket-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .bucket-amount {
    width: 100%;
    justify-content: space-between;
  }
}

/* Animation classes for financial funnel */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in-up {
  animation: slideInUp 0.6s ease-out forwards;
  opacity: 0;
}

.animate-slide-in-up.delay-100 {
  animation-delay: 0.1s;
}

.animate-slide-in-up.delay-200 {
  animation-delay: 0.2s;
}
</style>
