<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">发票对账</h2>
      <div class="header-actions">
        <el-button @click="showPendingInvoices">
          <el-icon><DocumentChecked /></el-icon>
          待对账发票
        </el-button>
        <el-button type="primary" @click="showManualReconcile">
          <el-icon><Plus /></el-icon>
          手动对账
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row" v-if="stats">
      <el-card class="stat-card">
        <div class="stat-label">总对账记录</div>
        <div class="stat-value">{{ stats.total }}</div>
      </el-card>
      <el-card
        class="stat-card"
        v-for="item in stats.byStatus"
        :key="item.status"
      >
        <div class="stat-label">{{ getStatusLabel(item.status) }}</div>
        <div class="stat-value">{{ item.count }}</div>
        <div class="stat-extra" v-if="item.totalDifference > 0">
          差异: ¥{{ formatCurrency(item.totalDifference) }}
        </div>
      </el-card>
    </div>

    <div class="table-container">
      <div class="table-toolbar">
        <div class="table-search">
          <el-select
            v-model="statusFilter"
            placeholder="对账状态"
            style="width: 140px"
            clearable
            @change="handleFilter"
          >
            <el-option label="完全匹配" value="matched" />
            <el-option label="未支付" value="unmatched" />
            <el-option label="少付" value="underpaid" />
            <el-option label="多付" value="overpaid" />
            <el-option label="部分支付" value="partial" />
          </el-select>
          <el-select
            v-model="approvalFilter"
            placeholder="审批状态"
            style="width: 140px"
            clearable
            @change="handleFilter"
          >
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </div>
      </div>

      <div
        class="table-infinite-container"
        v-infinite-scroll="loadMore"
        :infinite-scroll-disabled="disabled"
      >
        <el-table
          v-loading="loading && currentPage === 1"
          :data="reconciliations"
          style="width: 100%"
        >
          <el-table-column
            prop="reconciliation_number"
            label="对账单号"
            width="180"
          />
          <el-table-column prop="invoice.invoice_number" label="发票编号" width="150" />
          <el-table-column label="客户名称" width="150">
            <template #default="{ row }">
              {{ row.invoice?.contract?.customer?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="invoice_amount" label="发票金额" width="120">
            <template #default="{ row }">
              ¥{{ formatCurrency(row.invoice_amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="paid_amount" label="已支付" width="120">
            <template #default="{ row }">
              ¥{{ formatCurrency(row.paid_amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="difference_amount" label="差异金额" width="120">
            <template #default="{ row }">
              <span :class="{ 'text-danger': row.difference_amount > 0 }">
                ¥{{ formatCurrency(row.difference_amount) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="对账状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="approval_status" label="审批状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getApprovalType(row.approval_status)">
                {{ getApprovalLabel(row.approval_status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reconciled_at" label="对账时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.reconciled_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewDetail(row.id)">
                查看
              </el-button>
              <el-button
                v-if="row.status !== 'matched' && row.approval_status === 'pending'"
                size="small"
                type="warning"
                @click="handleDifference(row)"
              >
                处理差异
              </el-button>
              <el-button
                v-if="row.approval_status === 'pending'"
                size="small"
                type="success"
                @click="approveReconciliation(row)"
              >
                审批
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="deleteReconciliation(row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="load-more-status" v-if="reconciliations.length > 0">
        <p v-if="loading">加载中...</p>
        <p v-if="noMore">没有更多数据了</p>
      </div>
    </div>

    <!-- 待对账发票对话框 -->
    <el-dialog
      v-model="pendingDialogVisible"
      title="待对账发票"
      width="80%"
    >
      <el-table
        v-loading="pendingLoading"
        :data="pendingInvoices"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="invoiceNumber" label="发票编号" width="150" />
        <el-table-column prop="customerName" label="客户名称" />
        <el-table-column prop="totalAmount" label="发票金额" width="120">
          <template #default="{ row }">
            ¥{{ formatCurrency(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="paidAmount" label="已支付" width="120">
          <template #default="{ row }">
            ¥{{ formatCurrency(row.paidAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="remainingAmount" label="剩余金额" width="120">
          <template #default="{ row }">
            ¥{{ formatCurrency(row.remainingAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'overdue' ? 'danger' : 'warning'">
              {{ row.status === 'overdue' ? '逾期' : '已开票' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              @click="autoReconcileSingle(row.id)"
            >
              自动对账
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="pendingDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="selectedInvoices.length === 0"
          @click="batchAutoReconcile"
        >
          批量对账 ({{ selectedInvoices.length }})
        </el-button>
      </template>
    </el-dialog>

    <!-- 手动对账对话框 -->
    <el-dialog
      v-model="manualDialogVisible"
      title="手动对账"
      width="60%"
    >
      <el-form :model="manualForm" label-width="100px">
        <el-form-item label="选择发票">
          <InvoiceSelect
            v-model="manualForm.invoiceId"
            placeholder="请选择发票"
            @change="handleInvoiceChange"
          />
        </el-form-item>
        <el-form-item label="选择支付" v-if="availablePayments.length > 0">
          <el-checkbox-group v-model="manualForm.paymentIds">
            <div
              v-for="payment in availablePayments"
              :key="payment.id"
              class="payment-item"
            >
              <el-checkbox :label="payment.id">
                {{ payment.payment_date }} - ¥{{ formatCurrency(payment.amount) }}
                ({{ payment.payment_method }})
                <span v-if="payment.reference_number">
                  - {{ payment.reference_number }}
                </span>
              </el-checkbox>
            </div>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="差异原因">
          <el-input
            v-model="manualForm.differenceReason"
            type="textarea"
            :rows="3"
            placeholder="如有差异，请说明原因"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="manualForm.notes"
            type="textarea"
            :rows="3"
            placeholder="其他备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!manualForm.invoiceId || manualForm.paymentIds.length === 0"
          @click="submitManualReconcile"
        >
          确认对账
        </el-button>
      </template>
    </el-dialog>

    <!-- 处理差异对话框 -->
    <el-dialog
      v-model="differenceDialogVisible"
      title="处理对账差异"
      width="50%"
    >
      <el-form :model="differenceForm" label-width="100px">
        <el-form-item label="对账单号">
          <el-input :value="currentReconciliation?.reconciliation_number" disabled />
        </el-form-item>
        <el-form-item label="差异金额">
          <el-input
            :value="'¥' + formatCurrency(currentReconciliation?.difference_amount || 0)"
            disabled
          />
        </el-form-item>
        <el-form-item label="处理方式">
          <el-radio-group v-model="differenceForm.action">
            <el-radio label="adjust_invoice">调整发票金额</el-radio>
            <el-radio label="refund">创建退款</el-radio>
            <el-radio label="write_off">核销差异</el-radio>
            <el-radio label="wait_payment">等待补款</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理原因">
          <el-input
            v-model="differenceForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请说明处理原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="differenceDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!differenceForm.reason"
          @click="submitHandleDifference"
        >
          确认处理
        </el-button>
      </template>
    </el-dialog>

    <!-- 审批对话框 -->
    <el-dialog
      v-model="approvalDialogVisible"
      title="审批对账记录"
      width="50%"
    >
      <el-form :model="approvalForm" label-width="100px">
        <el-form-item label="对账单号">
          <el-input :value="currentReconciliation?.reconciliation_number" disabled />
        </el-form-item>
        <el-form-item label="审批结果">
          <el-radio-group v-model="approvalForm.approved">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input
            v-model="approvalForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请填写审批意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approvalDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApproval">
          确认审批
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reconciliationApi } from '@/api/reconciliation'
import { invoiceApi } from '@/api'
import { useKitStore } from '@/stores/kit'
import type {
  Reconciliation,
  ReconciliationStats,
  PendingInvoice,
  Payment,
} from '@/api/types'
import InvoiceSelect from '@/components/InvoiceSelect.vue'

const router = useRouter()
const kitStore = useKitStore()

// 状态
const loading = ref(false)
const reconciliations = ref<Reconciliation[]>([])
const stats = ref<ReconciliationStats | null>(null)
const statusFilter = ref('')
const approvalFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const noMore = ref(false)

// 待对账发票
const pendingDialogVisible = ref(false)
const pendingLoading = ref(false)
const pendingInvoices = ref<PendingInvoice[]>([])
const selectedInvoices = ref<PendingInvoice[]>([])

// 手动对账
const manualDialogVisible = ref(false)
const manualForm = ref({
  invoiceId: null as number | null,
  paymentIds: [] as number[],
  differenceReason: '',
  notes: '',
})
const availablePayments = ref<Payment[]>([])

// 处理差异
const differenceDialogVisible = ref(false)
const differenceForm = ref({
  action: 'wait_payment' as 'adjust_invoice' | 'refund' | 'write_off' | 'wait_payment',
  reason: '',
})
const currentReconciliation = ref<Reconciliation | null>(null)

// 审批
const approvalDialogVisible = ref(false)
const approvalForm = ref({
  approved: true,
  notes: '',
})

const disabled = computed(() => loading.value || noMore.value)

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(amount)
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 获取对账状态标签
const getStatusLabel = (status: string) => {
  const map = {
    matched: '完全匹配',
    unmatched: '未支付',
    underpaid: '少付',
    overpaid: '多付',
    partial: '部分支付',
  }
  return map[status] || status
}

// 获取对账状态类型
const getStatusType = (status: string) => {
  const map = {
    matched: 'success',
    unmatched: 'info',
    underpaid: 'warning',
    overpaid: 'danger',
    partial: 'warning',
  }
  return map[status] || 'info'
}

// 获取审批状态标签
const getApprovalLabel = (status: string) => {
  const map = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
  }
  return map[status] || status
}

// 获取审批状态类型
const getApprovalType = (status: string) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  }
  return map[status] || 'info'
}

// 获取对账列表
const fetchReconciliations = async (append = false) => {
  try {
    if (!append) {
      currentPage.value = 1
      reconciliations.value = []
      noMore.value = false
    }

    loading.value = true
    const response = await reconciliationApi.getReconciliations({
      page: currentPage.value,
      pageSize: pageSize.value,
      status: statusFilter.value || undefined,
      approvalStatus: approvalFilter.value || undefined,
    })

    if (response.success && response.data) {
      const newItems = response.data.items || []
      const totalCount = response.data.total

      if (append) {
        reconciliations.value = [...reconciliations.value, ...newItems]
      } else {
        reconciliations.value = newItems
      }

      total.value = totalCount
      // 修复无限滚动：当已加载数量达到总数，或当前页返回空数据时停止
      noMore.value = reconciliations.value.length >= totalCount || newItems.length < pageSize.value
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取对账列表失败')
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (!loading.value && !noMore.value) {
    currentPage.value++
    fetchReconciliations(true)
  }
}

// 筛选处理
const handleFilter = () => {
  fetchReconciliations()
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await reconciliationApi.getStats()
    if (response.success && response.data) {
      stats.value = response.data
    }
  } catch (error: any) {
    console.error('获取统计数据失败:', error)
  }
}

// 显示待对账发票
const showPendingInvoices = async () => {
  pendingDialogVisible.value = true
  pendingLoading.value = true
  try {
    const response = await reconciliationApi.getPendingInvoices()
    if (response.success && response.data) {
      pendingInvoices.value = response.data
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取待对账发票失败')
  } finally {
    pendingLoading.value = false
  }
}

// 选择发票
const handleSelectionChange = (selection: PendingInvoice[]) => {
  selectedInvoices.value = selection
}

// 单个自动对账
const autoReconcileSingle = async (invoiceId: number) => {
  try {
    const response = await reconciliationApi.autoReconcile(invoiceId)
    if (response.success) {
      ElMessage.success('自动对账成功')
      pendingDialogVisible.value = false
      fetchReconciliations()
      fetchStats()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '自动对账失败')
  }
}

// 批量自动对账
const batchAutoReconcile = async () => {
  try {
    const invoiceIds = selectedInvoices.value.map(inv => inv.id)
    const response = await reconciliationApi.batchAutoReconcile(invoiceIds)
    if (response.success) {
      ElMessage.success(`批量对账完成`)
      pendingDialogVisible.value = false
      fetchReconciliations()
      fetchStats()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '批量对账失败')
  }
}

// 显示手动对账
const showManualReconcile = () => {
  manualDialogVisible.value = true
  manualForm.value = {
    invoiceId: null,
    paymentIds: [],
    differenceReason: '',
    notes: '',
  }
  availablePayments.value = []
}

// 发票变更
const handleInvoiceChange = async (invoiceId: number) => {
  if (!invoiceId) {
    availablePayments.value = []
    return
  }

  try {
    const response = await invoiceApi.getInvoiceById(invoiceId, {
      viewAll: kitStore.viewAllKits,
    })
    if (response.success && response.data) {
      availablePayments.value = response.data.payments?.filter(
        p => p.status === 'completed'
      ) || []
    }
  } catch (error: any) {
    ElMessage.error('获取支付记录失败')
  }
}

// 提交手动对账
const submitManualReconcile = async () => {
  try {
    const response = await reconciliationApi.manualReconcile({
      invoiceId: manualForm.value.invoiceId!,
      paymentIds: manualForm.value.paymentIds,
      differenceReason: manualForm.value.differenceReason,
      notes: manualForm.value.notes,
    })
    if (response.success) {
      ElMessage.success('手动对账成功')
      manualDialogVisible.value = false
      fetchReconciliations()
      fetchStats()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '手动对账失败')
  }
}

// 处理差异
const handleDifference = (reconciliation: Reconciliation) => {
  currentReconciliation.value = reconciliation
  differenceDialogVisible.value = true
  differenceForm.value = {
    action: 'wait_payment',
    reason: '',
  }
}

// 提交差异处理
const submitHandleDifference = async () => {
  try {
    const response = await reconciliationApi.handleDifference(
      currentReconciliation.value!.id,
      differenceForm.value
    )
    if (response.success) {
      ElMessage.success('差异处理成功')
      differenceDialogVisible.value = false
      fetchReconciliations()
      fetchStats()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '差异处理失败')
  }
}

// 审批对账
const approveReconciliation = (reconciliation: Reconciliation) => {
  currentReconciliation.value = reconciliation
  approvalDialogVisible.value = true
  approvalForm.value = {
    approved: true,
    notes: '',
  }
}

// 提交审批
const submitApproval = async () => {
  try {
    const response = await reconciliationApi.approveReconciliation(
      currentReconciliation.value!.id,
      approvalForm.value
    )
    if (response.success) {
      ElMessage.success(approvalForm.value.approved ? '审批通过' : '审批拒绝')
      approvalDialogVisible.value = false
      fetchReconciliations()
      fetchStats()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '审批失败')
  }
}

// 删除对账记录
const deleteReconciliation = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条对账记录吗？', '提示', {
      type: 'warning',
    })

    const response = await reconciliationApi.deleteReconciliation(id)
    if (!response.success) {
      ElMessage.error(response.message || '删除失败')
      return
    }

    ElMessage.success('删除成功')
    fetchReconciliations()
    fetchStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 查看详情
const viewDetail = (id: number) => {
  router.push(`/reconciliations/${id}`)
}

onMounted(() => {
  fetchReconciliations()
  fetchStats()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.stat-extra {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.table-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.table-toolbar {
  margin-bottom: 16px;
}

.table-search {
  display: flex;
  gap: 12px;
}

.table-infinite-container {
  max-height: 600px;
  overflow-y: auto;
}

.load-more-status {
  text-align: center;
  padding: 20px;
  color: #999;
}

.text-danger {
  color: #f56c6c;
}

.payment-item {
  margin-bottom: 8px;
}
</style>
