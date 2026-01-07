<template>
  <div class="contract-card" :class="`card-${contract.billingStatus}`">
    <div class="card-header">
      <div class="header-left">
        <div class="contract-number">{{ contract.contract_number }}</div>
        <div class="contract-title">{{ contract.title }}</div>
      </div>
      <el-tag :type="getStatusType(contract.status)" size="large">
        {{ getStatusText(contract.status) }}
      </el-tag>
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

    <el-divider />

    <div class="amount-section">
      <div class="amount-label">💰 合同金额</div>
      <div class="amount-value">
        ¥{{ formatCurrency(contract.total_amount) }}
      </div>
    </div>

    <div class="financial-section">
      <div class="section-title">财务状况</div>

      <el-tag
        :type="getBillingStatusType(contract.billingStatus)"
        size="large"
        class="billing-tag"
      >
        {{ contract.billingStatusText }}
      </el-tag>

      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-label">📄 开票</span>
          <span class="progress-info">
            ¥{{ formatCurrency(contract.invoicedAmount || 0) }}
            <span class="percent"
              >({{
                getInvoicePercent(
                  contract.invoicedAmount,
                  contract.total_amount,
                )
              }}%)</span
            >
          </span>
        </div>
        <div class="progress-track">
          <div
            class="progress-bar invoice"
            :style="{
              width: `${getInvoicePercent(contract.invoicedAmount, contract.total_amount)}%`,
            }"
          ></div>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-label">💵 收款</span>
          <span class="progress-info">
            ¥{{ formatCurrency(contract.paidAmount || 0) }}
            <span class="percent"
              >({{
                getPaymentPercent(contract.paidAmount, contract.total_amount)
              }}%)</span
            >
          </span>
        </div>
        <div class="progress-track">
          <div
            class="progress-bar payment"
            :style="{
              width: `${getPaymentPercent(contract.paidAmount, contract.total_amount)}%`,
            }"
          ></div>
        </div>
      </div>

      <div
        v-if="contract.unpaidAmount > 0 || contract.uninvoicedAmount > 0"
        class="remaining-section"
      >
        <span v-if="contract.uninvoicedAmount > 0" class="remaining-item">
          未开票: ¥{{ formatCurrency(contract.uninvoicedAmount) }}
        </span>
        <span v-if="contract.unpaidAmount > 0" class="remaining-item danger">
          未收款: ¥{{ formatCurrency(contract.unpaidAmount) }}
        </span>
      </div>
    </div>

    <div class="card-actions">
      <el-button size="default" @click.stop="handleView"> 查看详情 </el-button>
      <el-button size="default" type="primary" @click.stop="handleEdit">
        编辑
      </el-button>
      <el-button
        v-if="contract.uninvoicedAmount > 0 && contract.status === 'active'"
        size="default"
        type="warning"
        @click.stop="handleInvoice"
      >
        去开票
      </el-button>
      <el-button
        v-if="contract.unpaidAmount > 0 && contract.invoicedAmount > 0"
        size="default"
        type="success"
        @click.stop="handlePayment"
      >
        去收款
      </el-button>
      <el-button size="default" type="danger" @click.stop="handleDelete">
        删除
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Calendar } from "@element-plus/icons-vue";

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
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  padding: 20px;
  min-width: 380px;
  max-width: 420px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
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
  margin-bottom: 12px;
}

.header-left {
  flex: 1;
  margin-right: 12px;
}

.contract-number {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.contract-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.customer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 13px;
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
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.amount-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.amount-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.financial-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.billing-tag {
  margin-bottom: 16px;
}

.progress-section {
  margin-bottom: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.progress-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.progress-info {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.percent {
  font-size: 11px;
  color: #909399;
  margin-left: 4px;
  font-weight: 400;
}

.progress-track {
  height: 8px;
  background: #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-bar.invoice {
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
}

.progress-bar.payment {
  background: linear-gradient(90deg, #67c23a 0%, #85ce61 100%);
}

.remaining-section {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e4e7ed;
}

.remaining-item {
  font-size: 12px;
  color: #909399;
}

.remaining-item.danger {
  color: #f56c6c;
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.card-actions :deep(.el-button) {
  flex: 1;
  min-width: calc(50% - 4px);
}
</style>
