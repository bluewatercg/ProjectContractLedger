<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">合同管理</h2>
      <el-button type="primary" @click="$router.push('/contracts/create')">
        <el-icon><Plus /></el-icon>
        新建合同
      </el-button>
    </div>

    <div class="table-container">
      <div class="table-toolbar">
        <div class="table-search">
          <el-input
            v-model="searchQuery"
            placeholder="搜索合同编号或标题"
            style="width: 250px"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <CustomerSelect
            v-model="customerFilter"
            placeholder="选择客户筛选（支持搜索）"
            width="250px"
            @change="handleCustomerFilter"
          />
          <div class="filter-group">
            <span class="filter-label">合同状态:</span>
            <el-segmented
              v-model="statusFilter"
              :options="contractStatusOptions"
              @change="handleFilter"
            />
          </div>
          <div class="filter-group">
            <span class="filter-label">财务状态:</span>
            <el-segmented
              v-model="billingStatusFilter"
              :options="billingStatusOptions"
              @change="handleFilter"
            />
          </div>
        </div>
        <div class="view-switcher">
          <el-segmented
            v-model="viewMode"
            :options="viewOptions"
            @change="handleViewModeChange"
          />
        </div>
      </div>

      <div v-if="viewMode === 'card'">
        <SkeletonLoader
          v-if="loading && currentPage === 1"
          type="card"
          :rows="3"
        />
        <div
          v-else
          class="contracts-grid"
          v-infinite-scroll="loadMore"
          :infinite-scroll-disabled="disabled"
          :infinite-scroll-distance="200"
        >
          <ContractCard
            v-for="contract in contracts"
            :key="contract.id"
            :contract="contract"
            @view="viewContract"
            @edit="editContract"
            @invoice="goToInvoice"
            @payment="goToPayment"
            @delete="deleteContract"
          />

          <div v-if="!loading && contracts.length === 0" class="card-empty-state">
            <div class="empty-icon">📦📝💰</div>
            <div class="empty-text">还没有创建任何合同</div>
            <el-button
              type="primary"
              size="large"
              @click="$router.push('/contracts/create')"
            >
              新建第一个合同
            </el-button>
          </div>
        </div>
      </div>
      
      <div v-else>
        <SkeletonLoader
          v-if="loading && currentPage === 1"
          type="table"
          :rows="10"
          :columns="9"
        />
        <div
          v-else
          class="table-infinite-container"
          v-infinite-scroll="loadMore"
          :infinite-scroll-disabled="disabled"
        >
          <el-table
            :data="contracts"
            style="width: 100%"
            :row-class-name="getRowClassName"
          >

            <el-table-column prop="contract_number" label="合同编号" width="140" fixed />
            <el-table-column prop="title" label="合同标题" min-width="180" show-overflow-tooltip />
            <el-table-column prop="customer.name" label="客户名称" width="150" show-overflow-tooltip />
            <el-table-column prop="businessCategory.name" label="业务分类" width="120" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.businessCategory">{{ row.businessCategory.name }}</span>
                <span v-else style="color: #c0c4cc">-</span>
              </template>
            </el-table-column>
            <!-- 套账列（仅在查看全部时显示） -->
            <el-table-column v-if="kitStore.viewAllKits" label="所属套账" width="120">
              <template #default="{ row }">
                <el-tag size="small" type="info">{{ getKitName(row.kit_id) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="财务状况" width="280">
              <template #default="{ row }">
                <div class="financial-status-cell" :class="`financial-${row.billingStatus}`">
                  <div class="financial-header">
                    <span class="contract-amount">💰 ¥{{ formatCurrency(row.total_amount) }}</span>
                    <el-tag :type="getBillingStatusType(row.billingStatus)" size="small">
                      {{ row.billingStatusText || "-" }}
                    </el-tag>
                  </div>
                  <div class="financial-progress">
                    <div class="progress-item">
                      <span class="progress-label">📄 开票:</span>
                      <span class="progress-value">
                        ¥{{ formatCurrency(row.invoicedAmount || 0) }}
                        <span class="progress-percent">({{ getInvoicePercent(row.invoicedAmount, row.total_amount) }}%)</span>
                      </span>
                    </div>
                    <div class="progress-item">
                      <span class="progress-label">💵 收款:</span>
                      <span class="progress-value">
                        ¥{{ formatCurrency(row.paidAmount || 0) }}
                        <span class="progress-percent">({{ getPaymentPercent(row.paidAmount, row.total_amount) }}%)</span>
                      </span>
                    </div>
                  </div>
                  <div class="financial-remaining" v-if="row.unpaidAmount > 0 || row.uninvoicedAmount > 0">
                    <span v-if="row.uninvoicedAmount > 0" class="remaining-tag">余额: ¥{{ formatCurrency(row.uninvoicedAmount) }}</span>
                    <span v-if="row.unpaidAmount > 0" class="remaining-tag danger">未收款: ¥{{ formatCurrency(row.unpaidAmount) }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="end_date" label="到期日" width="110" />
            <el-table-column prop="status" label="合同状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="280" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="viewContract(row.id)">查看</el-button>
                <el-button size="small" type="primary" @click="editContract(row.id)">编辑</el-button>
                <el-button v-if="row.uninvoicedAmount > 0 && row.status === 'active'" size="small" type="warning" @click="goToInvoice(row.id)">去开票</el-button>
                <el-button v-if="row.unpaidAmount > 0 && row.invoicedAmount > 0" size="small" type="success" @click="goToPayment(row.id)">去收款</el-button>
                <el-button size="small" type="danger" @click="deleteContract(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div class="load-more-status" v-if="contracts.length > 0">
        <p v-if="loading">加载中...</p>
        <p v-if="noMore">没有更多数据了</p>
      </div>



      <el-empty
        v-if="!loading && contracts.length === 0 && viewMode === 'table'"
        description="暂无合同数据"
        :image-size="200"
      >
        <el-button type="primary" @click="$router.push('/contracts/create')">
          新建合同
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import { contractApi } from "@/api";
import type { Contract, Customer } from "@/api/types";
import { useKitStore } from "@/stores/kit";
import CustomerSelect from "@/components/CustomerSelect.vue";
import ContractCard from "@/components/ContractCard.vue";
import SkeletonLoader from "@/components/SkeletonLoader.vue";

const router = useRouter();
const kitStore = useKitStore();

const savedViewMode = localStorage.getItem("contractViewMode") as
  | "table"
  | "card"
  | null;

const loading = ref(false);
const contracts = ref<any[]>([]);
const searchQuery = ref('');
const customerFilter = ref<number | null>(null);
const statusFilter = ref("");
const billingStatusFilter = ref("");
const currentPage = ref(1);
const pageSize = ref(12); // 默认每页12条
const total = ref(0);
const noMore = ref(false);
const viewMode = ref<"table" | "card">(savedViewMode || "table");

const disabled = computed(() => loading.value || noMore.value);

// 监听 kitStore 的 viewAllKits 和 currentKitId 变化，自动刷新数据
watch([() => kitStore.viewAllKits, () => kitStore.currentKitId], () => {
  currentPage.value = 1;
  contracts.value = [];
  noMore.value = false;
  fetchContracts(false);
});

let searchTimeout: NodeJS.Timeout | null = null;

const viewOptions = [
  { label: "表格", value: "table" },
  { label: "卡片", value: "card" },
];

const contractStatusOptions = [
  { label: "全部", value: "" },
  { label: "草稿", value: "draft" },
  { label: "执行中", value: "active" },
  { label: "已完成", value: "completed" },
  { label: "已取消", value: "cancelled" },
  { label: "已到期-不续签", value: "expired_non_renewed" },
];

const billingStatusOptions = [
  { label: "全部", value: "" },
  { label: "待开票", value: "pending_invoice" },
  { label: "待收款", value: "pending_payment" },
  { label: "部分开票", value: "partial_invoice" },
  { label: "已完成", value: "completed" },
];

const handleViewModeChange = (mode: "table" | "card") => {
  viewMode.value = mode;
  localStorage.setItem("contractViewMode", mode);
  handleFilter(); // 切换视图时重置并刷新
};

// 获取套账名称
const getKitName = (kitId: number) => {
  const kit = kitStore.kits.find(k => k.id === kitId);
  return kit?.name || '未知套账';
};

// 格式化货币
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

// 获取合同状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: "info",
    active: "success",
    completed: "primary",
    cancelled: "danger",
    expired_non_renewed: "danger",
  };
  return statusMap[status] || "info";
};

// 获取合同状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: "草稿",
    active: "执行中",
    completed: "已完成",
    cancelled: "已取消",
    expired_non_renewed: "已到期-不续签",
  };
  return statusMap[status] || status;
};

// 获取财务状态类型
const getBillingStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending_invoice: "warning",
    pending_payment: "danger",
    partial_invoice: "info",
    completed: "success",
  };
  return statusMap[status] || "info";
};

// 获取行样式类
const getRowClassName = ({ row }: { row: any }) => {
  if (row.billingStatus === "pending_payment") {
    return "row-pending-payment";
  }
  if (row.billingStatus === "pending_invoice") {
    return "row-pending-invoice";
  }
  return "";
};

// 处理客户筛选变化
const handleCustomerFilter = (
  customerId: number | null,
  customer: Customer | null,
) => {
  customerFilter.value = customerId;
  currentPage.value = 1;
  fetchContracts();
};

// 搜索处理（防抖）
const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchContracts();
  }, 500);
};

// 获取合同列表
const fetchContracts = async (append = false) => {
  try {
    if (!append) {
      currentPage.value = 1;
      contracts.value = [];
      noMore.value = false;
    }

    loading.value = true;
    const response = await contractApi.getContracts({
      page: currentPage.value,
      limit: pageSize.value,
      customerId: customerFilter.value || undefined,
      status: statusFilter.value,
      billingStatus: billingStatusFilter.value,
      search: searchQuery.value || undefined,
      viewAll: kitStore.viewAllKits,
    });

    if (response.success && response.data) {
      const newItems = response.data.items || [];
      const totalCount = response.data.total;

      if (append) {
        contracts.value = sortContractsByPriority([...contracts.value, ...newItems]);
      } else {
        contracts.value = sortContractsByPriority(newItems);
      }

      total.value = totalCount;
      if (contracts.value.length >= totalCount || newItems.length < pageSize.value) {
        noMore.value = true;
      }
    }
  } catch (error) {
    console.error("Failed to fetch contracts:", error);
    noMore.value = true; // 出错时停止无限滚动，防止无限重试
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  if (disabled.value) return;
  currentPage.value++;
  fetchContracts(true);
};


const sortContractsByPriority = (contracts: any[]) => {
  return contracts.sort((a, b) => {
    const priorityA = getContractPriority(a);
    const priorityB = getContractPriority(b);
    return priorityB - priorityA;
  });
};

const getContractPriority = (contract: any) => {
  if (contract.billingStatus === "pending_payment") return 3;
  if (contract.billingStatus === "pending_invoice") return 2;
  return 1;
};

// 筛选处理
const handleFilter = () => {
  fetchContracts(false);
};






// 查看合同
const viewContract = (id: number) => {
  router.push(`/contracts/${id}`);
};

// 编辑合同
const editContract = (id: number) => {
  router.push(`/contracts/${id}/edit`);
};

// 去开票
const goToInvoice = (contractId: number) => {
  router.push(`/invoices/create?contractId=${contractId}`);
};

// 去收款
const goToPayment = (contractId: number) => {
  // 先跳转到合同详情页的发票列表，用户可以选择对应发票进行收款
  router.push(`/contracts/${contractId}`);
};

// 删除合同
const deleteContract = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这个合同吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const response = await contractApi.deleteContract(id, {
      viewAll: kitStore.viewAllKits,
    });
    if (response.success) {
      ElMessage.success("删除成功");
      fetchContracts();
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to delete contract:", error);
    }
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchContracts();
});
</script>

<style scoped>
.load-more-status {
  text-align: center;
  padding: 20px 0;
  color: #909399;
  font-size: 14px;
}

.table-infinite-container {
  overflow-y: auto;
  max-height: calc(100vh - 250px);
}


.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.table-search {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
}

.view-switcher {
  display: flex;
  align-items: center;
  gap: 12px;
}

:deep(.el-segmented) {
  --el-segmented-bg-color: #f5f7fa;
  --el-segmented-item-selected-bg-color: #409eff;
}

/* 卡片网格布局 */
.contracts-grid {
  display: grid;
  gap: 16px;
  padding: 12px 4px;
}

/* Desktop: 4 columns */
@media (min-width: 1200px) {
  .contracts-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Tablet: 3 columns */
@media (min-width: 768px) and (max-width: 1199px) {
  .contracts-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Mobile: 1 column */
@media (max-width: 767px) {
  .contracts-grid {
    grid-template-columns: 1fr;
  }

  .table-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .table-search {
    flex-direction: column;
  }

  .view-switcher {
    justify-content: center;
  }
}

/* 卡片空状态 */
.card-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  grid-column: 1 / -1;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.empty-text {
  font-size: 16px;
  color: #909399;
  margin-bottom: 24px;
}

/* 财务状况单元格样式 */
.financial-status-cell {
  padding: 8px;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.financial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.contract-amount {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.financial-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.progress-label {
  color: #606266;
  font-weight: 500;
}

.progress-value {
  color: #303133;
}

.progress-percent {
  font-size: 11px;
  color: #909399;
  margin-left: 4px;
}

.financial-remaining {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e4e7ed;
}

.remaining-tag {
  font-size: 12px;
  color: #909399;
}

.remaining-tag.danger {
  color: #f56c6c;
  font-weight: 500;
}

/* 财务状态特殊样式 */
.financial-pending_payment {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  border-color: #fbc4c4;
}

.financial-pending_invoice {
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  border-color: #b3d8ff;
}

.financial-completed {
  background: linear-gradient(135deg, #f0f9ff 0%, #e1f3d8 100%);
  border-color: #c2e7b0;
}

/* 行样式 */
:deep(.row-pending-payment) {
  background-color: #fef0f0 !important;
}

:deep(.row-pending-payment:hover > td) {
  background-color: #fde2e2 !important;
}

:deep(.row-pending-invoice) {
  background-color: #ecf5ff !important;
}

:deep(.row-pending-invoice:hover > td) {
  background-color: #d9ecff !important;
}
</style>
