<template>
  <div class="financial-summary">
    <ReportFilter
      :start-date="queryParams.startDate"
      :end-date="queryParams.endDate"
      :group-by="queryParams.groupBy"
      @query="handleQuery"
      @export="handleExport"
      @print="handlePrint"
    />

    <!-- 财务健康度指标 -->
    <el-card shadow="never" class="health-card" v-loading="loading">
      <template #header>
        <span class="card-title">财务健康度指标</span>
      </template>

      <div class="health-grid">
        <div class="health-item">
          <div class="health-label">合同履约率</div>
          <div class="health-value">
            {{ formatPercentage(reportData?.financialHealth.contractFulfillmentRate || 0) }}
          </div>
          <el-progress
            :percentage="reportData?.financialHealth.contractFulfillmentRate || 0"
            :color="getProgressColor(reportData?.financialHealth.contractFulfillmentRate || 0)"
          />
        </div>

        <div class="health-item">
          <div class="health-label">发票支付率</div>
          <div class="health-value">
            {{ formatPercentage(reportData?.financialHealth.invoicePaymentRate || 0) }}
          </div>
          <el-progress
            :percentage="reportData?.financialHealth.invoicePaymentRate || 0"
            :color="getProgressColor(reportData?.financialHealth.invoicePaymentRate || 0)"
          />
        </div>

        <div class="health-item">
          <div class="health-label">回款效率</div>
          <div class="health-value">
            {{ formatPercentage(reportData?.financialHealth.collectionEfficiency || 0) }}
          </div>
          <el-progress
            :percentage="reportData?.financialHealth.collectionEfficiency || 0"
            :color="getProgressColor(reportData?.financialHealth.collectionEfficiency || 0)"
          />
        </div>

        <div class="health-item">
          <div class="health-label">对账准确率</div>
          <div class="health-value">
            {{ formatPercentage(reportData?.financialHealth.reconciliationAccuracy || 0) }}
          </div>
          <el-progress
            :percentage="reportData?.financialHealth.reconciliationAccuracy || 0"
            :color="getProgressColor(reportData?.financialHealth.reconciliationAccuracy || 0)"
          />
        </div>
      </div>
    </el-card>

    <!-- 各模块汇总 -->
    <div class="card-grid" v-loading="loading">
      <el-card shadow="never">
        <template #header>
          <span class="card-title">合同汇总</span>
        </template>
        <div class="module-summary">
          <div class="summary-item">
            <span class="label">合同总数：</span>
            <span class="value">{{ reportData?.contracts.summary.totalCount || 0 }}</span>
          </div>
          <div class="summary-item">
            <span class="label">合同总额：</span>
            <span class="value">¥{{ formatAmount(reportData?.contracts.summary.totalAmount || 0) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">执行中：</span>
            <span class="value">{{ reportData?.contracts.summary.activeCount || 0 }}</span>
          </div>
          <div class="summary-item">
            <span class="label">已完成：</span>
            <span class="value">{{ reportData?.contracts.summary.completedCount || 0 }}</span>
          </div>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <span class="card-title">发票汇总</span>
        </template>
        <div class="module-summary">
          <div class="summary-item">
            <span class="label">发票总数：</span>
            <span class="value">{{ reportData?.invoices.summary.totalCount || 0 }}</span>
          </div>
          <div class="summary-item">
            <span class="label">发票总额：</span>
            <span class="value">¥{{ formatAmount(reportData?.invoices.summary.totalAmount || 0) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">已支付：</span>
            <span class="value">¥{{ formatAmount(reportData?.invoices.summary.paidAmount || 0) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">未支付：</span>
            <span class="value">¥{{ formatAmount(reportData?.invoices.summary.unpaidAmount || 0) }}</span>
          </div>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <span class="card-title">支付汇总</span>
        </template>
        <div class="module-summary">
          <div class="summary-item">
            <span class="label">支付总数：</span>
            <span class="value">{{ reportData?.payments.summary.totalCount || 0 }}</span>
          </div>
          <div class="summary-item">
            <span class="label">支付总额：</span>
            <span class="value">¥{{ formatAmount(reportData?.payments.summary.totalAmount || 0) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">已完成：</span>
            <span class="value">{{ reportData?.payments.summary.completedCount || 0 }}</span>
          </div>
          <div class="summary-item">
            <span class="label">平均金额：</span>
            <span class="value">¥{{ formatAmount(reportData?.payments.summary.averageAmount || 0) }}</span>
          </div>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <span class="card-title">对账汇总</span>
        </template>
        <div class="module-summary">
          <div class="summary-item">
            <span class="label">对账总数：</span>
            <span class="value">{{ reportData?.reconciliations.summary.totalCount || 0 }}</span>
          </div>
          <div class="summary-item">
            <span class="label">已匹配：</span>
            <span class="value">{{ reportData?.reconciliations.summary.matchedCount || 0 }}</span>
          </div>
          <div class="summary-item">
            <span class="label">未匹配：</span>
            <span class="value">{{ reportData?.reconciliations.summary.unmatchedCount || 0 }}</span>
          </div>
          <div class="summary-item">
            <span class="label">差异总额：</span>
            <span class="value">¥{{ formatAmount(reportData?.reconciliations.summary.totalDifference || 0) }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 打印预览 -->
    <PrintPreview
      v-model="showPrintPreview"
      report-title="财务汇总报表"
      :date-range="dateRangeText"
    >
      <div class="print-content">
        <div class="summary-section">
          <h3>财务健康度指标</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">合同履约率：</span>
              <span class="detail-value">{{ formatPercentage(reportData?.financialHealth.contractFulfillmentRate || 0) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">发票支付率：</span>
              <span class="detail-value">{{ formatPercentage(reportData?.financialHealth.invoicePaymentRate || 0) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">回款效率：</span>
              <span class="detail-value">{{ formatPercentage(reportData?.financialHealth.collectionEfficiency || 0) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">对账准确率：</span>
              <span class="detail-value">{{ formatPercentage(reportData?.financialHealth.reconciliationAccuracy || 0) }}</span>
            </div>
          </div>
        </div>

        <div class="summary-section">
          <h3>各模块汇总</h3>
          <el-table :data="moduleSummaryData" border stripe>
            <el-table-column prop="module" label="模块" />
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
import ReportFilter from '@/components/ReportFilter.vue'
import PrintPreview from '@/components/PrintPreview.vue'
import { reportApi } from '@/api/report'
import { exportReport, formatAmount as formatAmountUtil, formatPercentage as formatPercentageUtil } from '@/utils/export'
import type { FinancialSummaryData, ReportQueryParams } from '@/api/types'

const loading = ref(false)
const reportData = ref<FinancialSummaryData | null>(null)
const showPrintPreview = ref(false)
const queryParams = ref<ReportQueryParams>({ groupBy: 'month' })

const dateRangeText = computed(() => {
  if (queryParams.value.startDate && queryParams.value.endDate) {
    return `${queryParams.value.startDate} 至 ${queryParams.value.endDate}`
  }
  return '全部时间'
})

const moduleSummaryData = computed(() => {
  if (!reportData.value) return []
  return [
    {
      module: '合同',
      count: reportData.value.contracts.summary.totalCount,
      amount: reportData.value.contracts.summary.totalAmount
    },
    {
      module: '发票',
      count: reportData.value.invoices.summary.totalCount,
      amount: reportData.value.invoices.summary.totalAmount
    },
    {
      module: '支付',
      count: reportData.value.payments.summary.totalCount,
      amount: reportData.value.payments.summary.totalAmount
    },
    {
      module: '对账',
      count: reportData.value.reconciliations.summary.totalCount,
      amount: 0
    }
  ]
})

const fetchReport = async () => {
  try {
    loading.value = true
    const response = await reportApi.getFinancialSummary(queryParams.value)
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
  await exportReport('financial', format, queryParams.value)
}

const handlePrint = () => {
  showPrintPreview.value = true
}

const formatAmount = (amount: number): string => {
  return formatAmountUtil(amount)
}

const formatPercentage = (value: number): string => {
  return formatPercentageUtil(value)
}

const getProgressColor = (percentage: number): string => {
  if (percentage >= 80) return '#67C23A'
  if (percentage >= 60) return '#E6A23C'
  return '#F56C6C'
}

const amountFormatter = (row: any, column: any, cellValue: any) => {
  return cellValue > 0 ? `¥${formatAmountUtil(cellValue)}` : '-'
}

onMounted(() => {
  fetchReport()
})
</script>

<style scoped>
.financial-summary {
  padding: 20px;
}

.health-card {
  margin-bottom: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.health-item {
  text-align: center;
}

.health-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.health-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.module-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item .label {
  font-size: 14px;
  color: #606266;
}

.summary-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
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

@media (max-width: 768px) {
  .health-grid {
    grid-template-columns: 1fr;
  }
}
</style>
