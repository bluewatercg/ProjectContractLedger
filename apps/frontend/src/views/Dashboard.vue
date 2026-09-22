<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">仪表板</h2>
      <p class="page-subtitle">合同、开票与收款的资金流转全景</p>
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
        </div>
        <div class="funnel-connector" aria-hidden="true"></div>

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
        </div>
        <div class="funnel-connector" aria-hidden="true"></div>

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
  formatCurrency as formatChartCurrency,
} from "@/utils/chartTheme";

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
            name: "应收金额",
            data: data.map((item) => item.revenue),
            color: chartColors.primary[0],
          },
          {
            name: "实收金额",
            data: data.map((item) => item.payments),
            color: chartColors.primary[1],
          },
        ],
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
            name: "贡献总额",
            data: data.map((item) => item.total),
            color: chartColors.primary[0],
          },
        ],
      });
      // 横向柱状图配置
      option.xAxis.type = "value";
      option.yAxis = {
        type: "category",
        data: data.map((item) => item.name),
        axisLine: { lineStyle: { color: "#E2E8F0" } },
        axisLabel: { color: "#64748B", fontSize: 12 },
        axisTick: { show: false },
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
/* Dashboard-specific styles - Stripe-inspired design system */

/* Page subtitle */
.page-subtitle {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: var(--color-text-muted, #64748d);
  font-weight: 400;
}

.financial-section {
  background: var(--color-bg-container, white);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--color-border-base);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}
.financial-section .section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.financial-section h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary, #0d253d);
}

.financial-funnel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40px minmax(0, 1fr) 40px minmax(0, 1fr);
  align-items: stretch;
  gap: 0;
  margin-bottom: 32px;
}

.funnel-item,
.funnel-itemHighlight,
.funnel-itemSuccess {
  min-width: 0;
  background: var(--color-bg-container, white);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--color-border-base);
  position: relative;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.funnel-item:hover,
.funnel-itemHighlight:hover,
.funnel-itemSuccess:hover {
  border-color: var(--color-primary, #533afd);
  box-shadow: 0 2px 8px rgba(83, 58, 253, 0.08);
}

.funnel-itemHighlight {
  background: var(--color-bg-active, #f0edff);
  border-color: var(--color-primary-light, #665efd);
  border-left-width: 3px;
}

.funnel-itemSuccess {
  background: #f0fdf4;
  border-color: var(--color-success, #10b981);
  border-left-width: 3px;
}

.funnel-label {
  font-size: 13px;
  color: var(--color-text-muted, #64748d);
  font-weight: 500;
  margin-bottom: 10px;
  letter-spacing: 0.02em;
}

.funnel-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary, #0d253d);
  margin-bottom: 6px;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  word-break: break-all;
}

.funnel-desc {
  font-size: 12px;
  color: var(--color-text-muted, #64748d);
  font-weight: 400;
}

.funnel-progress {
  margin-top: 12px;
}

.funnel-connector {
  align-self: center;
  height: 1px;
  background: repeating-linear-gradient(
    90deg,
    var(--color-border-base) 0,
    var(--color-border-base) 4px,
    transparent 4px,
    transparent 8px
  );
  position: relative;
}

.funnel-connector::after {
  content: "";
  position: absolute;
  right: 0;
  top: -3px;
  width: 0;
  height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 6px solid var(--color-primary, #533afd);
}

.financial-details-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.detail-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 12px;
  background: var(--color-bg-container, white);
  border: 1px solid var(--color-border-base);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  min-width: 0;
}

.detail-card:hover {
  border-color: var(--color-primary, #533afd);
  box-shadow: 0 2px 8px rgba(83, 58, 253, 0.08);
}

.detail-card.primary {
  background: var(--color-bg-active, #f0edff);
  border-color: var(--color-primary-light, #665efd);
}
.detail-card.success {
  background: #f0fdf4;
  border-color: var(--color-success, #10b981);
}
.detail-card.warning {
  background: #fffbeb;
  border-color: var(--color-warning, #f59e0b);
}
.detail-card.danger {
  background: #fef2f2;
  border-color: var(--color-danger, #ef4444);
}
.detail-card.info {
  background: var(--color-bg-page, #f6f9fc);
  border-color: var(--color-border-base);
}

.detail-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.detail-label {
  font-size: 13px;
  color: var(--color-text-muted, #64748d);
  margin-bottom: 4px;
}

.detail-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary, #0d253d);
  font-variant-numeric: tabular-nums;
  word-break: break-all;
}

.detail-sub {
  font-size: 11px;
  margin-top: 4px;
  font-weight: normal;
  display: block;
  color: var(--color-danger, #ef4444);
}

.detail-icon {
  font-size: 22px;
  opacity: 0.5;
  color: var(--color-text-muted, #64748d);
}

.info-icon {
  color: var(--color-text-muted, #64748d);
  cursor: help;
  font-size: 16px;
}

.charts-row {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.chart-container {
  background: var(--color-bg-container, white);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--color-border-base);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
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
  font-size: 15px;
  color: var(--color-text-primary, #0d253d);
  font-weight: 600;
}

.chart-box {
  height: 280px;
  width: 100%;
}

.quick-actions {
  margin-top: 24px;
  background: var(--color-bg-container, white);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--color-border-base);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.quick-actions h3 {
  margin: 0 0 16px 0;
  font-size: 15px;
  color: var(--color-text-primary, #0d253d);
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 提醒区域样式 */
.reminders-section {
  background: var(--color-bg-container, white);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--color-border-base);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  color: var(--color-text-primary, #0d253d);
  font-size: 16px;
  font-weight: 600;
}

.reminder-stats {
  display: flex;
  gap: 10px;
  align-items: center;
}

.priority-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--color-bg-page, #f6f9fc);
  border-radius: 8px;
}

.priority-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}

.priority-item.high {
  color: var(--color-danger, #ef4444);
}

.priority-item.medium {
  color: var(--color-warning, #f59e0b);
}

.priority-item.low {
  color: var(--color-success, #10b981);
}

.reminders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-section {
  border: 1px solid var(--color-border-base);
  border-radius: 10px;
  overflow: hidden;
}

.category-title {
  margin: 0;
  padding: 12px 16px;
  background: var(--color-bg-page, #f6f9fc);
  border-bottom: 1px solid var(--color-border-base);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-regular, #273951);
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-section .reminder-item {
  margin: 0;
  border: none;
  border-bottom: 1px solid var(--color-border-base);
  border-radius: 0;
}

.category-section .reminder-item:last-child {
  border-bottom: none;
}

.reminder-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid var(--color-border-base);
  border-radius: 8px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  background: var(--color-bg-container, white);
}

.reminder-item:hover {
  border-color: var(--color-primary, #533afd);
  box-shadow: 0 2px 8px rgba(83, 58, 253, 0.08);
}

.reminder-item.priority-high {
  border-left: 3px solid var(--color-danger, #ef4444);
}

.reminder-item.priority-medium {
  border-left: 3px solid var(--color-warning, #f59e0b);
}

.reminder-item.priority-low {
  border-left: 3px solid var(--color-success, #10b981);
}

.reminder-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-bg-active, #f0edff);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  font-size: 16px;
  color: var(--color-primary, #533afd);
}

.reminder-content {
  flex: 1;
  min-width: 0;
}

.reminder-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #0d253d);
  margin-bottom: 4px;
  line-height: 1.4;
}

.reminder-description {
  font-size: 13px;
  color: var(--color-text-muted, #64748d);
  margin-bottom: 6px;
  line-height: 1.4;
}

.reminder-meta {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: var(--color-text-muted, #64748d);
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
  background: var(--color-bg-container, white);
  border: 1px solid var(--color-warning, #f59e0b);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.renewal-section .section-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary, #0d253d);
}

.renewal-icon {
  color: var(--color-warning, #f59e0b);
  font-size: 18px;
}

.renewal-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.renewal-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: var(--color-bg-page, #f6f9fc);
  border-radius: 10px;
  border: 1px solid var(--color-border-base);
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.renewal-item:hover {
  border-color: var(--color-warning, #f59e0b);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);
}

.renewal-item.priority-high {
  border-left: 3px solid var(--color-danger, #ef4444);
}

.renewal-item.priority-medium {
  border-left: 3px solid var(--color-warning, #f59e0b);
}

.renewal-item.priority-low {
  border-left: 3px solid var(--color-success, #10b981);
}

.renewal-countdown {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.renewal-countdown.urgent {
  background: var(--color-danger, #ef4444);
  color: white;
}

.renewal-countdown.warning {
  background: var(--color-warning, #f59e0b);
  color: white;
}

.renewal-countdown.normal {
  background: var(--color-success, #10b981);
  color: white;
}

.countdown-number {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.countdown-label {
  font-size: 10px;
  margin-top: 4px;
  opacity: 0.9;
}

.renewal-content {
  flex: 1;
  min-width: 0;
}

.renewal-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #0d253d);
  margin-bottom: 4px;
}

.renewal-customer {
  font-size: 13px;
  color: var(--color-text-muted, #64748d);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.renewal-amount {
  font-size: 13px;
  color: var(--color-text-muted, #64748d);
  font-variant-numeric: tabular-nums;
}

.renewal-actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.no-renewals {
  text-align: center;
  padding: 24px 20px;
  background: var(--color-bg-page, #f6f9fc);
  border-radius: 10px;
}

@media (max-width: 1200px) {
  .financial-funnel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .funnel-item,
  .funnel-itemHighlight,
  .funnel-itemSuccess {
    width: auto;
    margin-bottom: 16px;
  }

  .funnel-connector {
    display: none;
  }

  .financial-details-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .financial-funnel {
    grid-template-columns: minmax(0, 1fr);
  }

  .funnel-item,
  .funnel-itemHighlight,
  .funnel-itemSuccess {
    width: auto;
  }

  .financial-details-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .charts-row {
    flex-direction: column;
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

  .renewal-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .renewal-countdown {
    width: 56px;
    height: 56px;
    margin-right: 0;
    margin-bottom: 8px;
  }

  .countdown-number {
    font-size: 20px;
  }

  .renewal-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}

/* 账龄分析区域 */
.aging-section {
  background: var(--color-bg-container, white);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--color-border-base);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.aging-section .section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-base);
}

.aging-section .header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.aging-section .section-icon {
  font-size: 18px;
  color: var(--color-primary, #533afd);
}

.aging-section h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary, #0d253d);
}

.aging-section .info-icon {
  color: var(--color-text-muted, #64748d);
  font-size: 16px;
  cursor: help;
}

.aging-section .info-icon:hover {
  color: var(--color-text-regular, #273951);
}

/* 汇总统计卡片行 */
.aging-summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.summary-card {
  background: var(--color-bg-page, #f6f9fc);
  border: 1px solid var(--color-border-base);
  border-radius: 10px;
  padding: 14px 16px;
  transition: border-color 0.2s;
}

.summary-card:hover {
  border-color: var(--color-primary, #533afd);
}

.summary-card.primary {
  background: var(--color-bg-active, #f0edff);
  border-color: var(--color-primary-light, #665efd);
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.summary-icon {
  font-size: 16px;
  color: var(--color-text-muted, #64748d);
}

.summary-card.primary .summary-icon {
  color: var(--color-primary, #533afd);
}

.summary-label {
  font-size: 12px;
  color: var(--color-text-muted, #64748d);
  font-weight: 500;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary, #0d253d);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.summary-card.primary .summary-value {
  color: var(--color-primary-dark, #2e2b8c);
}

.summary-value .unit {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-muted, #64748d);
  margin-left: 4px;
}

/* 账龄分布列表 */
.aging-buckets {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bucket-row {
  background: var(--color-bg-container, white);
  border: 1px solid var(--color-border-base);
  border-radius: 10px;
  padding: 12px 16px;
  transition: border-color 0.2s;
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
}

.bucket-row.risk-low::before {
  background: var(--color-success, #10b981);
}

.bucket-row.risk-medium::before {
  background: var(--color-warning, #f59e0b);
}

.bucket-row.risk-high::before {
  background: var(--color-danger, #ef4444);
}

.bucket-row:hover {
  border-color: var(--color-primary, #533afd);
}

.bucket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
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
  background: var(--color-success, #10b981);
}

.risk-indicator.risk-medium {
  background: var(--color-warning, #f59e0b);
}

.risk-indicator.risk-high {
  background: var(--color-danger, #ef4444);
}

.bucket-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary, #0d253d);
}

.bucket-count {
  font-size: 11px;
  color: var(--color-text-muted, #64748d);
  background: var(--color-bg-page, #f6f9fc);
  padding: 2px 8px;
  border-radius: 10px;
}

.bucket-amount {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.bucket-amount .amount {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary, #0d253d);
  font-variant-numeric: tabular-nums;
}

.bucket-amount .percentage {
  font-size: 12px;
  color: var(--color-text-muted, #64748d);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.bucket-progress {
  height: 4px;
  background: var(--color-bg-page, #f6f9fc);
  border-radius: 2px;
  overflow: hidden;
}

.bucket-progress .progress-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}

.bucket-progress .progress-bar.risk-low {
  background: var(--color-success, #10b981);
}

.bucket-progress .progress-bar.risk-medium {
  background: var(--color-warning, #f59e0b);
}

.bucket-progress .progress-bar.risk-high {
  background: var(--color-danger, #ef4444);
}

.no-aging-data {
  padding: 32px 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .aging-section {
    padding: 16px;
  }

  .aging-summary-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .summary-value {
    font-size: 18px;
  }

  .bucket-amount .amount {
    font-size: 14px;
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

/* Simple fade-in animation */
.animate-slide-in-up {
  animation: fadeIn 0.4s ease-out forwards;
  opacity: 0;
}

.animate-slide-in-up.delay-100 {
  animation-delay: 0.1s;
}

.animate-slide-in-up.delay-200 {
  animation-delay: 0.2s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
