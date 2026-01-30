<template>
  <div class="invoice-report">
    <!-- 筛选器 -->
    <ReportFilter
      :start-date="queryParams.startDate"
      :end-date="queryParams.endDate"
      :group-by="queryParams.groupBy"
      @query="handleQuery"
      @export="handleExport"
      @print="handlePrint"
    />

    <!-- 汇总卡片 -->
    <div class="card-grid" v-loading="loading">
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">发票总数</span>
          <el-icon class="stat-card-icon"><Tickets /></el-icon>
        </div>
        <div class="stat-card-value">{{ reportData?.summary.totalCount || 0 }}</div>
        <div class="stat-card-change">全部发票</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">发票总额</span>
          <el-icon class="stat-card-icon"><Money /></el-icon>
        </div>
        <div class="stat-card-value">¥{{ formatAmount(reportData?.summary.totalAmount || 0) }}</div>
        <div class="stat-card-change">累计金额</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">已支付金额</span>
          <el-icon class="stat-card-icon"><CircleCheck /></el-icon>
        </div>
        <div class="stat-card-value">¥{{ formatAmount(reportData?.summary.paidAmount || 0) }}</div>
        <div class="stat-card-change">已收款</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">未支付金额</span>
          <el-icon class="stat-card-icon"><Warning /></el-icon>
        </div>
        <div class="stat-card-value">¥{{ formatAmount(reportData?.summary.unpaidAmount || 0) }}</div>
        <div class="stat-card-change">待收款</div>
      </div>
    </div>

    <!-- 趋势图表 -->
    <ReportChart
      title="发票趋势分析"
      :data="reportData?.trend || []"
      :loading="loading"
      :supported-types="['bar', 'line']"
      x-axis-key="periodLabel"
      y-axis-key="amount"
      series-name="发票金额"
    />

    <!-- 状态分布图表 -->
    <ReportChart
      title="发票状态分布"
      :data="reportData?.statusDistribution || []"
      :loading="loading"
      chart-type="pie"
      :supported-types="['pie', 'bar']"
      x-axis-key="statusLabel"
      y-axis-key="amount"
      series-name="发票金额"
    />

    <!-- 数据表格 -->
    <ReportTable
      title="发票趋势明细"
      :data="reportData?.trend || []"
      :columns="trendColumns"
      :loading="loading"
      :show-summary="true"
    />

    <!-- 打印预览 -->
    <PrintPreview
      v-model="showPrintPreview"
      report-title="发票报表"
      :date-range="dateRangeText"
    >
      <div class="print-content">
        <div class="summary-section">
          <h3>汇总信息</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">发票总数：</span>
              <span class="detail-value">{{ reportData?.summary.totalCount || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">发票总额：</span>
              <span class="detail-value">¥{{ formatAmount(reportData?.summary.totalAmount || 0) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">已支付金额：</span>
              <span class="detail-value">¥{{ formatAmount(reportData?.summary.paidAmount || 0) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">未支付金额：</span>
              <span class="detail-value">¥{{ formatAmount(reportData?.summary.unpaidAmount || 0) }}</span>
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

        <div class="summary-section">
          <h3>状态分布</h3>
          <el-table :data="reportData?.statusDistribution || []" border stripe>
            <el-table-column prop="statusLabel" label="状态" />
            <el-table-column prop="count" label="数量" />
            <el-table-column prop="amount" label="金额" :formatter="amountFormatter" />
            <el-table-column prop="percentage" label="占比" :formatter="percentageFormatter" />
          </el-table>
        </div>
      </div>
    </PrintPreview>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Tickets, Money, CircleCheck, Warning } from '@element-plus/icons-vue'
import ReportFilter from '@/components/ReportFilter.vue'
import ReportChart from '@/components/ReportChart.vue'
import ReportTable from '@/components/ReportTable.vue'
import PrintPreview from '@/components/PrintPreview.vue'
import { reportApi } from '@/api/report'
import { exportReport, formatAmount as formatAmountUtil } from '@/utils/export'
import type { InvoiceReportData, ReportQueryParams } from '@/api/types'

// State
const loading = ref(false)
const reportData = ref<InvoiceReportData | null>(null)
const showPrintPreview = ref(false)
const queryParams = ref<ReportQueryParams>({
  groupBy: 'month'
})

// Computed
const dateRangeText = computed(() => {
  if (queryParams.value.startDate && queryParams.value.endDate) {
    return `${queryParams.value.startDate} 至 ${queryParams.value.endDate}`
  }
  return '全部时间'
})

// Table columns
const trendColumns = [
  { prop: 'periodLabel', label: '周期', width: 150 },
  { prop: 'count', label: '发票数量', width: 120, align: 'right' },
  {
    prop: 'amount',
    label: '发票金额',
    align: 'right',
    formatter: (row: any) => `¥${formatAmountUtil(row.amount)}`
  }
]

// Methods
const fetchReport = async () => {
  try {
    loading.value = true
    const response = await reportApi.getInvoiceReport(queryParams.value)
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
  queryParams.value = {
    ...queryParams.value,
    ...params
  }
  fetchReport()
}

const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
  await exportReport('invoice', format, queryParams.value)
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

const percentageFormatter = (row: any, column: any, cellValue: any) => {
  return `${cellValue.toFixed(2)}%`
}

// Lifecycle
onMounted(() => {
  fetchReport()
})
</script>

<style scoped>
.invoice-report {
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

@media print {
  .invoice-report {
    padding: 0;
  }
}
</style>
