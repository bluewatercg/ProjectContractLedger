<template>
  <div class="payment-report">
    <ReportFilter
      :start-date="queryParams.startDate"
      :end-date="queryParams.endDate"
      :group-by="queryParams.groupBy"
      @query="handleQuery"
      @export="handleExport"
      @print="handlePrint"
    />

    <div class="card-grid" v-loading="loading">
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">支付总数</span>
          <el-icon class="stat-card-icon"><Money /></el-icon>
        </div>
        <div class="stat-card-value">{{ reportData?.summary.totalCount || 0 }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">支付总额</span>
          <el-icon class="stat-card-icon"><Wallet /></el-icon>
        </div>
        <div class="stat-card-value">¥{{ formatAmount(reportData?.summary.totalAmount || 0) }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">已完成支付</span>
          <el-icon class="stat-card-icon"><CircleCheck /></el-icon>
        </div>
        <div class="stat-card-value">{{ reportData?.summary.completedCount || 0 }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">平均支付金额</span>
          <el-icon class="stat-card-icon"><TrendCharts /></el-icon>
        </div>
        <div class="stat-card-value">¥{{ formatAmount(reportData?.summary.averageAmount || 0) }}</div>
      </div>
    </div>

    <ReportChart
      title="支付趋势分析"
      :data="reportData?.trend || []"
      :loading="loading"
      :supported-types="['bar', 'line']"
      x-axis-key="periodLabel"
      y-axis-key="amount"
      series-name="支付金额"
    />

    <ReportChart
      title="支付方式分布"
      :data="reportData?.methodDistribution || []"
      :loading="loading"
      chart-type="pie"
      :supported-types="['pie', 'bar']"
      x-axis-key="methodLabel"
      y-axis-key="amount"
      series-name="支付金额"
    />

    <ReportTable
      title="支付趋势明细"
      :data="reportData?.trend || []"
      :columns="trendColumns"
      :loading="loading"
      :show-summary="true"
    />

    <PrintPreview
      v-model="showPrintPreview"
      report-title="支付报表"
      :date-range="dateRangeText"
    >
      <div class="print-content">
        <div class="summary-section">
          <h3>汇总信息</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">支付总数：</span>
              <span class="detail-value">{{ reportData?.summary.totalCount || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">支付总额：</span>
              <span class="detail-value">¥{{ formatAmount(reportData?.summary.totalAmount || 0) }}</span>
            </div>
          </div>
        </div>

        <div class="summary-section">
          <h3>趋势数据</h3>
          <el-table :data="reportData?.trend || []" border stripe>
            <el-table-column prop="periodLabel" label="周期" />
            <el-table-column prop="count" label="数量" />
            <el-table-column prop="amount" label="金额" :formatter="amountFormatter" />
          </el-table>
        </div>
      </div>
    </PrintPreview>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Money, Wallet, CircleCheck, TrendCharts } from '@element-plus/icons-vue'
import ReportFilter from '@/components/ReportFilter.vue'
import ReportChart from '@/components/ReportChart.vue'
import ReportTable from '@/components/ReportTable.vue'
import PrintPreview from '@/components/PrintPreview.vue'
import { reportApi } from '@/api/report'
import { exportReport, formatAmount as formatAmountUtil } from '@/utils/export'
import type { PaymentReportData, ReportQueryParams } from '@/api/types'

const loading = ref(false)
const reportData = ref<PaymentReportData | null>(null)
const showPrintPreview = ref(false)
const queryParams = ref<ReportQueryParams>({ groupBy: 'month' })

const dateRangeText = computed(() => {
  if (queryParams.value.startDate && queryParams.value.endDate) {
    return `${queryParams.value.startDate} 至 ${queryParams.value.endDate}`
  }
  return '全部时间'
})

const trendColumns = [
  { prop: 'periodLabel', label: '周期', width: 150 },
  { prop: 'count', label: '支付数量', width: 120, align: 'right' },
  {
    prop: 'amount',
    label: '支付金额',
    align: 'right',
    formatter: (row: any) => `¥${formatAmountUtil(row.amount)}`
  }
]

const fetchReport = async () => {
  try {
    loading.value = true
    const response = await reportApi.getPaymentReport(queryParams.value)
    if (response.success) {
      reportData.value = response.data
    } else {
      ElMessage.error(response.message || '获取报表数据失败')
    }
  } catch (error) {
    console.error('Fetch report error:', error)
    ElMessage.error('获取报表数据失败')
  } finally {
    loading.value = false
  }
}

const handleQuery = (params: any) => {
  queryParams.value = { ...queryParams.value, ...params }
  fetchReport()
}

const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
  await exportReport('payment', format, queryParams.value)
}

const handlePrint = () => {
  showPrintPreview.value = true
}

const formatAmount = (amount: number): string => {
  return formatAmountUtil(amount)
}

const amountFormatter = (row: any, column: any, cellValue: any) => {
  return `¥${formatAmountUtil(cellValue)}`
}

onMounted(() => {
  fetchReport()
})
</script>

<style scoped>
.payment-report {
  padding: 20px;
}

.summary-section {
  margin-bottom: 30px;
  page-break-inside: avoid;
}

.summary-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}

.print-content {
  padding: 20px 0;
}
</style>
