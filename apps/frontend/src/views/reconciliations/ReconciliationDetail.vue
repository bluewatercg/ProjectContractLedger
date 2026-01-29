<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title">对账详情</h2>
      </div>
      <div class="header-right">
        <el-button
          v-if="reconciliation?.status !== 'matched' && reconciliation?.approval_status === 'pending'"
          type="warning"
          @click="showHandleDifference"
        >
          处理差异
        </el-button>
        <el-button
          v-if="reconciliation?.approval_status === 'pending'"
          type="success"
          @click="showApproval"
        >
          审批
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="detail-content">
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <span>对账信息</span>
            <el-tag :type="getStatusType(reconciliation?.status)">
              {{ getStatusLabel(reconciliation?.status) }}
            </el-tag>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="对账单号">
            {{ reconciliation?.reconciliation_number }}
          </el-descriptions-item>
          <el-descriptions-item label="审批状态">
            <el-tag :type="getApprovalType(reconciliation?.approval_status)">
              {{ getApprovalLabel(reconciliation?.approval_status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发票编号">
            <el-link
              type="primary"
              @click="viewInvoice(reconciliation?.invoice_id)"
            >
              {{ reconciliation?.invoice?.invoice_number }}
            </el-link>
          </el-descriptions-item>
          <el-descriptions-item label="客户名称">
            {{ reconciliation?.invoice?.contract?.customer?.name }}
          </el-descriptions-item>
          <el-descriptions-item label="合同编号">
            {{ reconciliation?.invoice?.contract?.contract_number }}
          </el-descriptions-item>
          <el-descriptions-item label="发票金额">
            <span class="amount-text">
              ¥{{ formatCurrency(reconciliation?.invoice_amount) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="已支付金额">
            <span class="amount-text">
              ¥{{ formatCurrency(reconciliation?.paid_amount) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="差异金额">
            <span
              class="amount-text"
              :class="{ 'text-danger': reconciliation?.difference_amount > 0 }"
            >
              ¥{{ formatCurrency(reconciliation?.difference_amount) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="对账人">
            {{ reconciliation?.reconciledByUser?.full_name || reconciliation?.reconciledByUser?.username }}
          </el-descriptions-item>
          <el-descriptions-item label="对账时间">
            {{ formatDate(reconciliation?.reconciled_at) }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="reconciliation?.approved_by"
            label="审批人"
          >
            {{ reconciliation?.approvedByUser?.full_name || reconciliation?.approvedByUser?.username }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="reconciliation?.approved_at"
            label="审批时间"
          >
            {{ formatDate(reconciliation?.approved_at) }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="reconciliation?.difference_reason"
            label="差异原因"
            :span="2"
          >
            {{ reconciliation?.difference_reason }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="reconciliation?.notes"
            label="备注"
            :span="2"
          >
            {{ reconciliation?.notes }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="details-card">
        <template #header>
          <span>对账明细</span>
        </template>

        <el-table :data="reconciliation?.details" border>
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="payment.payment_date" label="支付日期" width="120" />
          <el-table-column prop="payment_amount" label="支付金额" width="120">
            <template #default="{ row }">
              ¥{{ formatCurrency(row.payment_amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="payment_method" label="支付方式" width="120">
            <template #default="{ row }">
              {{ getPaymentMethodLabel(row.payment_method) }}
            </template>
          </el-table-column>
          <el-table-column prop="reference_number" label="交易流水号" />
          <el-table-column prop="is_matched" label="匹配状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.is_matched ? 'success' : 'warning'">
                {{ row.is_matched ? '已匹配' : '未匹配' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="notes" label="备注" />
        </el-table>

        <div class="summary-row">
          <span class="summary-label">支付记录总计：</span>
          <span class="summary-value">
            {{ reconciliation?.details?.length || 0 }} 笔
          </span>
          <span class="summary-label">总金额：</span>
          <span class="summary-value amount-text">
            ¥{{ formatCurrency(reconciliation?.paid_amount) }}
          </span>
        </div>
      </el-card>
    </div>

    <!-- 处理差异对话框 -->
    <el-dialog
      v-model="differenceDialogVisible"
      title="处理对账差异"
      width="50%"
    >
      <el-form :model="differenceForm" label-width="100px">
        <el-form-item label="差异金额">
          <el-input
            :value="'¥' + formatCurrency(reconciliation?.difference_amount || 0)"
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { reconciliationApi } from '@/api/reconciliation'
import type { Reconciliation } from '@/api/types'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const reconciliation = ref<Reconciliation | null>(null)

// 处理差异
const differenceDialogVisible = ref(false)
const differenceForm = ref({
  action: 'wait_payment' as 'adjust_invoice' | 'refund' | 'write_off' | 'wait_payment',
  reason: '',
})

// 审批
const approvalDialogVisible = ref(false)
const approvalForm = ref({
  approved: true,
  notes: '',
})

// 格式化货币
const formatCurrency = (amount: number | undefined) => {
  if (!amount) return '0'
  return new Intl.NumberFormat('zh-CN').format(amount)
}

// 格式化日期
const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 获取对账状态标签
const getStatusLabel = (status: string | undefined) => {
  if (!status) return '-'
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
const getStatusType = (status: string | undefined) => {
  if (!status) return 'info'
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
const getApprovalLabel = (status: string | undefined) => {
  if (!status) return '-'
  const map = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
  }
  return map[status] || status
}

// 获取审批状态类型
const getApprovalType = (status: string | undefined) => {
  if (!status) return 'info'
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  }
  return map[status] || 'info'
}

// 获取支付方式标签
const getPaymentMethodLabel = (method: string) => {
  const map = {
    bank_transfer: '银行转账',
    cash: '现金',
    check: '支票',
    online: '在线支付',
    other: '其他',
  }
  return map[method] || method
}

// 获取对账详情
const fetchDetail = async () => {
  const id = Number(route.params.id)
  if (!id) {
    ElMessage.error('对账记录ID无效')
    router.back()
    return
  }

  loading.value = true
  try {
    const response = await reconciliationApi.getReconciliationById(id)
    if (response.success && response.data) {
      reconciliation.value = response.data
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取对账详情失败')
    router.back()
  } finally {
    loading.value = false
  }
}

// 查看发票
const viewInvoice = (invoiceId: number | undefined) => {
  if (invoiceId) {
    router.push(`/invoices/${invoiceId}`)
  }
}

// 显示处理差异对话框
const showHandleDifference = () => {
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
      reconciliation.value!.id,
      differenceForm.value
    )
    if (response.success) {
      ElMessage.success('差异处理成功')
      differenceDialogVisible.value = false
      fetchDetail()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '差异处理失败')
  }
}

// 显示审批对话框
const showApproval = () => {
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
      reconciliation.value!.id,
      approvalForm.value
    )
    if (response.success) {
      ElMessage.success(approvalForm.value.approved ? '审批通过' : '审批拒绝')
      approvalDialogVisible.value = false
      fetchDetail()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '审批失败')
  }
}

onMounted(() => {
  fetchDetail()
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

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  gap: 10px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card,
.details-card {
  background: white;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-text {
  font-weight: 600;
  font-size: 16px;
}

.text-danger {
  color: #f56c6c;
}

.summary-row {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-end;
}

.summary-label {
  font-size: 14px;
  color: #666;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
</style>
