<template>
  <div class="report-index">
    <div class="page-header">
      <h1 class="page-title">报表中心</h1>
    </div>

    <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
      <el-tab-pane label="合同报表" name="contract">
        <ContractReport v-if="activeTab === 'contract'" />
      </el-tab-pane>

      <el-tab-pane label="发票报表" name="invoice">
        <InvoiceReport v-if="activeTab === 'invoice'" />
      </el-tab-pane>

      <el-tab-pane label="支付报表" name="payment">
        <PaymentReport v-if="activeTab === 'payment'" />
      </el-tab-pane>

      <el-tab-pane label="对账报表" name="reconciliation">
        <ReconciliationReport v-if="activeTab === 'reconciliation'" />
      </el-tab-pane>

      <el-tab-pane label="财务汇总" name="financial">
        <FinancialSummary v-if="activeTab === 'financial'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ContractReport from './ContractReport.vue'
import InvoiceReport from './InvoiceReport.vue'
import PaymentReport from './PaymentReport.vue'
import ReconciliationReport from './ReconciliationReport.vue'
import FinancialSummary from './FinancialSummary.vue'

// State
const activeTab = ref('contract')

// Methods
const handleTabChange = (tabName: string) => {
  console.log('Tab changed to:', tabName)
}
</script>

<style scoped>
.report-index {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 20px;
}

:deep(.el-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
}

:deep(.el-tab-pane) {
  height: 100%;
}
</style>
