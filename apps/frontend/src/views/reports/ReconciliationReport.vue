<template>
  <div class="reconciliation-report">
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
          <span class="stat-card-title">对账总数</span>
          <el-icon class="stat-card-icon"><DocumentChecked /></el-icon>
        </div>
        <div class="stat-card-value">{{ reportData?.summary.totalCount || 0 }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">已匹配</span>
          <el-icon class="stat-card-icon"><CircleCheck /></el-icon>
        </div>
        <div class="stat-card-value">{{ reportData?.summary.matchedCount || 0 }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">未匹配</span>
          <el-icon class="stat-card-icon"><Warning /></el-icon>
        </div>
        <div class="stat-card-value">{{ reportData?.summary.unmatchedCount || 0 }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">差异总额</span>
          <el-icon class="stat-card-icon"><Money /></el-icon>
        </div>
        <div class="stat-card-value">¥{{ formatAmount(reportData?.summary.totalDifference || 0) }}</div>
      </div>
    </div>

    <ReportChart
      title="对账趋势分析"
      :data="reportData?.trend || []"
      :loading="loading"
      :supported-types="['bar', 'line']"
      x-axis-key="periodLabel"
      y-axis-key="count"
      series-name="对账数量"
    />

    <ReportChart
      title="对账状态分布"
      :data="reportData?.statusDistribution || []"
      :loading="loading"
      chart-type="pie"
      :supported-types="['pie', 'bar']"
      x-axis-key="statusLabel"
      y-axis-key="count"
      series-name="对账数量"
    />

    <ReportTable
      title="对账趋势明细"
      :data="reportData?.trend || []"
      :columns="trendColumns"
      :loading="loading"
      :show-summary="true"
    />

    <PrintPreview
      v-model="showPrintPreview"
      report-title="对账报表"
      :date-range="dateRangeText"
    >
      <div class="print-content">
        <div class="summary-section">
          <h3>汇总信息</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">对账总数：</span>
              <span class="detail-value">{{ reportData?.summary.totalCount || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">已匹配：</span>
              <span class="detail-value">{{ reportData?.summary.matchedCount || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">未匹配：</span>
              <span class="detail-value">{{ reportData?.summary.unmatchedCount || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">差异总额：</span>
              <span class="detail-value">¥{{ formatAmount(reportData?.summary.totalDifference || 0) }}</span>
            </div>
          </div>
        </div>

        <div class="summary-section">
          <h3>趋势数据</h3>
          <el-table :data="reportData?.trend || []" border stripe>
            <el-table-column prop="periodLabel" label="周期" />
            <el-table-column prop="count" label="数量" />
          </el-table>
        </div>
      </div>
    </PrintPreview>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentChecked, CircleCheck, Warning, Money } from '@element-plus/icons-vue'
import ReportFilter from '@/components/ReportFilter.vue'
import ReportChart from '@/components/ReportChart.vue'
import ReportTable from '@/components/ReportTable.vue'
import PrintPreview from '@/components/PrintPreview.vue'
import { reportApi } from '@/api/report'
import { exportReport, formatAmount as formatAmountUtil } from '@/utils/export'
import type { ReconciliationReportData, ReportQueryParams } from '@/api/types'

const loading = ref(false)
const reportData = ref<ReconciliationReportData | null>(null)
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
  { prop: 'count', label: '对账数量', width: 120, align: 'right' }
]

const fetchReport = async () => {
  try {
    loading.value = true
    const response = await reportApi.getReconciliationReport(queryParams.value)
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
  await exportReport('reconciliation', format, queryParams.value)
}

const handlePrint = () => {
  showPrintPreview.value = true
}

const formatAmount = (amount: number): string => {
  return formatAmountUtil(amount)
}

onMounted(() => {
  fetchReport()
})
</script>

<style scoped>
.reconciliation-report {
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
