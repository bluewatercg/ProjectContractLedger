<template>
  <div class="contract-card" :class="`card-${contract.billingStatus}`" @click="handleView">
    <div class="card-header">
      <div class="header-left">
        <div class="contract-number">{{ contract.contract_number }}</div>
        <div class="contract-title">{{ contract.title }}</div>
      </div>
      <div class="header-tags">
        <el-tag :type="getStatusType(contract.status)" size="small">
          {{ getStatusText(contract.status) }}
        </el-tag>
        <el-tag
          :type="getBillingStatusType(contract.billingStatus)"
          size="small"
        >
          {{ contract.billingStatusText }}
        </el-tag>
      </div>
    </div>

    <div class="customer-info">
      <span class="customer-name">
        <el-icon><User /></el-icon>
        {{ contract.customer?.name }}
      </span>
      <span class="end-date">
        <el-icon><Calendar /></el-icon>
        {{ contract.end_date }}
      </span>
    </div>

    <el-divider style="margin: 12px 0" />

    <div class="financial-overview">
      <!-- 1. 开票进度 (对比合同总额) -->
      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-title">📝 开票进度 (余额 ¥{{ formatCurrency(contract.uninvoicedAmount) }})</span>
          <span class="progress-value">¥{{ formatCurrency(contract.invoicedAmount) }} / ¥{{ formatCurrency(contract.total_amount) }}</span>
        </div>
        <div class="dual-progress-bar billing">
          <div
            class="bar-filled"
            :style="{ width: `${getPercent(contract.invoicedAmount, contract.total_amount)}%` }"
          >
            <span class="bar-text" v-if="getPercent(contract.invoicedAmount, contract.total_amount) === 100">
              100%
            </span>
            <span class="bar-text" v-else-if="getPercent(contract.invoicedAmount, contract.total_amount) > 15">
              已开 {{ getPercent(contract.invoicedAmount, contract.total_amount) }}%
            </span>
          </div>
          <div class="bar-unfilled" :style="{ width: `${100 - getPercent(contract.invoicedAmount, contract.total_amount)}%` }">
            <span class="bar-text-light" v-if="100 - getPercent(contract.invoicedAmount, contract.total_amount) > 0">
              余额 {{ 100 - getPercent(contract.invoicedAmount, contract.total_amount) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- 2. 回款进度 (分张发票展示) -->
      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-title">💰 回款进度 (共 {{ contract.invoiceCount || 0 }} 张发票)</span>
          <span class="progress-value">¥{{ formatCurrency(contract.paidAmount) }} / ¥{{ formatCurrency(contract.invoicedAmount) }}</span>
        </div>
        <div class="segmented-progress-bar collection" :class="{ 'disabled': !contract.invoicedAmount }">
          <template v-if="contract.invoicedAmount > 0 && contract.invoiceStats && contract.invoiceStats.length > 0">
            <el-tooltip
              v-for="inv in contract.invoiceStats"
              :key="inv.id"
              effect="dark"
              placement="top"
            >
              <template #content>
                发票: {{ inv.invoice_number }}<br/>
                面额: ¥{{ formatCurrency(inv.total_amount) }}<br/>
                已收: ¥{{ formatCurrency(inv.paidAmount) }}<br/>
                状态: {{ inv.paidAmount >= inv.total_amount ? '已清' : '挂账' }}
              </template>
              <div
                class="invoice-segment"
                :style="{ width: `${getPercent(inv.total_amount, contract.invoicedAmount)}%` }"
              >
                <div
                  class="invoice-fill"
                  :style="{ width: `${getPercent(inv.paidAmount, inv.total_amount)}%` }"
                >
                  <span class="segment-label" v-if="getPercent(inv.paidAmount, inv.total_amount) > 30">
                    {{ getPercent(inv.paidAmount, inv.total_amount) }}%
                  </span>
                </div>
                <span class="segment-label-empty" v-if="getPercent(inv.paidAmount, inv.total_amount) <= 30">
                  {{ getPercent(inv.paidAmount, inv.total_amount) }}%
                </span>
              </div>
            </el-tooltip>
          </template>
          <div v-else-if="contract.invoicedAmount > 0" class="bar-empty">加载中...</div>
          <div v-else class="bar-empty">尚未开票，暂无收款进度</div>
        </div>
      </div>

    </div>

    <div class="card-actions">
      <el-button size="small" @click.stop="handleEdit">
        <el-icon><Edit /></el-icon>
        编辑
      </el-button>
      <el-button
        size="small"
        type="warning"
        plain
        @click.stop="handleInvoice"
      >
        <el-icon><Document /></el-icon>
        去开票
      </el-button>
      <el-button
        size="small"
        type="success"
        plain
        @click.stop="handlePayment"
      >
        <el-icon><Money /></el-icon>
        去收款
      </el-button>
      <el-button size="small" type="danger" @click.stop="handleDelete">
        <el-icon><Delete /></el-icon>
        删除
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Calendar, Money, Document, Edit, Delete } from "@element-plus/icons-vue";

const props = defineProps<{
  contract: any;
}>();

const emit = defineEmits<{
  view: [id: number];
  edit: [id: number];
  invoice: [id: number];
  payment: [id: number];
  delete: [id: number];
}>();

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("zh-CN").format(amount || 0);
};

const getPercent = (value: number, total: number) => {
  if (!total || total <= 0) return 0;
  return Math.round(((value || 0) / total) * 100);
};

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: "info",
    active: "success",
    completed: "primary",
    cancelled: "danger",
  };
  return statusMap[status] || "info";
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: "草稿",
    active: "执行中",
    completed: "已完成",
    cancelled: "已取消",
  };
  return statusMap[status] || status;
};

const getBillingStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending_invoice: "warning",
    pending_payment: "danger",
    partial_invoice: "info",
    completed: "success",
  };
  return statusMap[status] || "info";
};

const handleView = () => {
  emit("view", props.contract.id);
};

const handleEdit = () => {
  emit("edit", props.contract.id);
};

const handleInvoice = () => {
  emit("invoice", props.contract.id);
};

const handlePayment = () => {
  emit("payment", props.contract.id);
};

const handleDelete = () => {
  emit("delete", props.contract.id);
};
</script>

<style scoped>
.contract-card {
  background: white;
  border-radius: 10px;
  border: 1px solid #e4e7ed;
  padding: 16px;
  min-width: 250px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.contract-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-pending_payment {
  border-color: #fbc4c4;
  border-width: 2px;
}

.card-pending_invoice {
  border-color: #b3d8ff;
  border-width: 2px;
}

.card-completed {
  border-color: #c2e7b0;
  border-width: 2px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.header-left {
  flex: 1;
  margin-right: 8px;
}

.header-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.contract-number {
  font-size: 11px;
  color: #909399;
  margin-bottom: 3px;
}

.contract-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  line-height: 1.3;
}

.customer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 12px;
}

.customer-name {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
}

.end-date {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
}

.amount-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 12px;
}

.amount-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.amount-value {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.financial-overview {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.progress-title {
  color: #606266;
  font-weight: 500;
}

.progress-value {
  color: #303133;
  font-weight: 600;
}

.dual-progress-bar,
.segmented-progress-bar {
  display: flex;
  height: 18px;
  border-radius: 9px;
  overflow: hidden;
  background: #f0f2f5;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.segmented-progress-bar.collection {
  gap: 4px; /* 增加间距使其更像独立的“段” */
  background: transparent;
  box-shadow: none;
  overflow: visible;
  height: 20px;
}

.invoice-segment {
  height: 100%;
  background: #f0f2f5;
  position: relative;
  overflow: hidden;
  border-radius: 4px; /* 圆角块状感 */
  border: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
}

.invoice-fill {
  height: 100%;
  background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
  transition: width 0.6s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.segment-label {
  font-size: 10px;
  color: white;
  font-weight: bold;
  white-space: nowrap;
}

.segment-label-empty {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #909399;
  font-weight: bold;
  white-space: nowrap;
}

.dual-progress-bar.billing .bar-filled {
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
}

.dual-progress-bar.collection .bar-filled {
  background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
}

.dual-progress-bar.disabled,
.segmented-progress-bar.disabled {
  opacity: 0.6;
  background: #ebeef5;
}

.bar-filled {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.6s ease;
  height: 100%;
}

.bar-unfilled {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.6s ease;
  height: 100%;
  background: transparent;
}

.bar-empty {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #909399;
}

.bar-text {
  font-size: 10px;
  color: white;
  font-weight: 600;
  white-space: nowrap;
}

.bar-text-light {
  font-size: 10px;
  color: #909399;
  white-space: nowrap;
}

.stats-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-top: 1px dashed #ebeef5;
  margin-top: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #606266;
}

.stat-item.highlight {
  font-weight: 600;
  color: #e6a23c;
}

.card-actions {
  display: flex;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.card-actions :deep(.el-button) {
  flex: 1;
  padding: 8px 4px;
  font-size: 12px;
  margin-left: 0 !important;
}
</style>
