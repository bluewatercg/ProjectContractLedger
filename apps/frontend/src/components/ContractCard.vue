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
      <div class="financial-header">
        <span class="financial-title">💰 合同金额</span>
        <span class="financial-amount"
          >¥{{ formatCurrency(contract.total_amount) }}</span
        >
      </div>

      <!-- 双色支付进度条 -->
      <div class="payment-overview-bar">
        <div class="payment-bar-wrapper">
          <div
            class="payment-bar-segment collected"
            :style="{ width: `${getPaymentPercent(contract.paidAmount, contract.total_amount)}%` }"
          >
            <span v-if="contract.paidAmount > 0" class="bar-label">
              已收 {{ getPaymentPercent(contract.paidAmount, contract.total_amount) }}%
            </span>
          </div>
          <div
            class="payment-bar-segment uncollected"
            :style="{ width: `${100 - getPaymentPercent(contract.paidAmount, contract.total_amount)}%` }"
          >
            <span v-if="contract.unpaidAmount > 0" class="bar-label">
              未收 {{ 100 - getPaymentPercent(contract.paidAmount, contract.total_amount) }}%
            </span>
          </div>
        </div>
        <div class="payment-amounts">
          <span class="amount-collected">已收: ¥{{ formatCurrency(contract.paidAmount || 0) }}</span>
          <span class="amount-uncollected">未收: ¥{{ formatCurrency(contract.unpaidAmount || 0) }}</span>
        </div>
      </div>

      <div class="financial-progress">
        <div class="progress-item">
          <div class="progress-label-row">
            <span class="progress-label">📄 已开票</span>
            <span class="progress-value"
              >¥{{ formatCurrency(contract.invoicedAmount || 0) }}
              <span class="progress-percent"
                >({{ getInvoicePercent(contract.invoicedAmount, contract.total_amount) }}%)</span
              >
            </span>
          </div>
          <div class="progress-bar-wrapper">
            <div
              class="progress-bar invoice"
              :style="{
                width: `${getInvoicePercent(contract.invoicedAmount, contract.total_amount)}%`,
              }"
            ></div>
          </div>
        </div>

        <div class="progress-item">
          <div class="progress-label-row">
            <span class="progress-label">💵 已收款</span>
            <span class="progress-value"
              >¥{{ formatCurrency(contract.paidAmount || 0) }}
              <span class="progress-percent"
                >({{ getPaymentPercent(contract.paidAmount, contract.total_amount) }}%)</span
              >
            </span>
          </div>
          <div class="progress-bar-wrapper">
            <div
              class="progress-bar payment"
              :style="{
                width: `${getPaymentPercent(contract.paidAmount, contract.total_amount)}%`,
              }"
            ></div>
          </div>
        </div>
      </div>

      <div
        v-if="contract.unpaidAmount > 0"
        class="financial-footer"
      >
        <span class="unpaid-amount">未收款: ¥{{ formatCurrency(contract.unpaidAmount) }}</span>
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
        @click.stop="handleInvoice"
      >
        <el-icon><Document /></el-icon>
        开票
      </el-button>
      <el-button
        size="small"
        type="success"
        @click.stop="handlePayment"
      >
        <el-icon><Money /></el-icon>
        收款
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

const getInvoicePercent = (invoicedAmount: number, totalAmount: number) => {
  if (!totalAmount || totalAmount === 0) return "0";
  return (((invoicedAmount || 0) / totalAmount) * 100).toFixed(0);
};

const getPaymentPercent = (paidAmount: number, totalAmount: number) => {
  if (!totalAmount || totalAmount === 0) return "0";
  return (((paidAmount || 0) / totalAmount) * 100).toFixed(0);
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
  min-width: 280px;
  max-width: 320px;
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
}

.financial-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 6px;
  border-left: 3px solid #ffa940;
}

.financial-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.financial-amount {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.financial-progress {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-label-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.progress-label {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
}

.progress-value {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.progress-percent {
  font-size: 11px;
  color: #909399;
  font-weight: 400;
  margin-left: 4px;
}

.progress-bar-wrapper {
  height: 10px;
  background: #f0f2f5;
  border-radius: 5px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  border-radius: 5px;
  transition: width 0.6s cubic-bezier(0.65, 0, 0.35, 1);
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3);
}

.progress-bar.invoice {
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
}

.progress-bar.payment {
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
}

.financial-footer {
  padding-top: 8px;
  border-top: 1px dashed #e4e7ed;
}

.unpaid-amount {
  font-size: 12px;
  font-weight: 600;
  color: #f56c6c;
}

.card-actions {
  display: flex;
  gap: 6px;
  padding-top: 14px;
  border-top: 1px solid #e4e7ed;
}

.card-actions :deep(.el-button) {
  flex: 1;
  padding: 7px 10px;
  font-size: 13px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.card-actions :deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.card-actions :deep(.el-button .el-icon) {
  margin-right: 2px;
  font-size: 14px;
}

/* 双色支付进度条样式 */
.payment-overview-bar {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 6px;
  border-left: 3px solid #52c41a;
}

.payment-bar-wrapper {
  display: flex;
  height: 32px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 8px;
}

.payment-bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.6s cubic-bezier(0.65, 0, 0.35, 1);
  position: relative;
}

.payment-bar-segment.collected {
  background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3);
}

.payment-bar-segment.uncollected {
  background: linear-gradient(90deg, #ff7875 0%, #ffa39e 100%);
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.2);
}

.bar-label {
  font-size: 11px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  padding: 0 8px;
}

.payment-amounts {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 500;
}

.amount-collected {
  color: #52c41a;
}

.amount-uncollected {
  color: #ff4d4f;
}
</style>
