<template>
  <div class="invoice-plan-panel">
    <div class="header">
      <h3 class="title">开票计划</h3>
      <p class="subtitle">
        按期管理本合同的开票安排，支持按照期数名称、比例、金额和日期进行配置。
      </p>
    </div>

    <el-alert
      type="info"
      show-icon
      class="mb-3"
      title="说明"
      :closable="false"
    >
      <template #default>
        <div>
          <div>1）计划金额之和建议与合同金额一致，用于对齐合同收支；</div>
          <div>2）需要开某期的票时，直接点该行「开票」，合同、客户与该期金额会自动带入，保存后即可上传发票附件；</div>
          <div>3）已有发票想并入某一期，点该行「关联发票」，填写该票计入本期的金额；</div>
          <div>4）提醒天数用于后续的开票提醒列表。</div>
        </div>
      </template>
    </el-alert>

    <el-table
      :data="editablePlans"
      border
      style="width: 100%"
      class="mb-3"
    >
      <el-table-column label="#" width="60" type="index" />

      <el-table-column label="期数名称" min-width="160">
        <template #default="scope">
          <el-input
            v-model="scope.row.phase_name"
            placeholder="例如：首付款、第二期"
            size="small"
          />
        </template>
      </el-table-column>

      <el-table-column label="支付比例(%)" width="150">
        <template #default="scope">
          <el-input-number
            v-model="scope.row.pay_ratio_percent"
            :min="0"
            :max="100"
            :step="5"
            :precision="2"
            size="small"
            style="width: 100%"
            @change="onRatioChange(scope.row)"
          />
        </template>
      </el-table-column>

      <el-table-column label="计划金额" width="180">
        <template #default="scope">
          <el-input-number
            v-model="scope.row.planned_amount"
            :min="0"
            :precision="2"
            size="small"
            style="width: 100%"
            @change="onAmountChange(scope.row)"
          >
            <template #prefix>
              <span class="currency-symbol">¥</span>
            </template>
          </el-input-number>
        </template>
      </el-table-column>

      <el-table-column label="预计开票日期" width="150">
        <template #default="scope">
          <el-date-picker
            v-model="scope.row.planned_invoice_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            size="small"
            style="width: 100%"
          />
        </template>
      </el-table-column>

      <el-table-column label="提前提醒天数" width="140">
        <template #default="scope">
          <el-input-number
            v-model="scope.row.remind_days_before"
            :min="0"
            :max="365"
            :step="1"
            size="small"
            style="width: 100%"
          />
        </template>
      </el-table-column>

      <el-table-column label="当前状态" width="140">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)" size="small">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="已分摊 / 计划" width="180">
        <template #default="scope">
          <div class="allocated-cell">
            <span :class="isOverAllocated(scope.row) ? 'text-danger' : ''">
              ¥{{ formatCurrency(scope.row.actual_invoiced_amount) }}
            </span>
            <span class="allocated-sep">/</span>
            <span class="text-muted">¥{{ formatCurrency(scope.row.planned_amount) }}</span>
            <span v-if="isOverAllocated(scope.row)" class="over-tag">
              +¥{{ formatCurrency(overAmount(scope.row)) }}
            </span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="250" fixed="right">
        <template #default="scope">
          <el-button
            v-if="scope.row.id"
            type="success"
            size="small"
            text
            @click="createInvoiceForPlan(scope.row)"
          >
            开票
          </el-button>
          <el-button
            v-if="scope.row.id"
            type="primary"
            size="small"
            text
            @click="openAllocationDialog(scope.row)"
          >
            关联发票
          </el-button>
          <el-popconfirm
            title="确认删除该期开票计划？若已分摊发票会删除失败。"
            @confirm="handleDeleteRow(scope.$index, scope.row)"
          >
            <template #reference>
              <el-button type="danger" size="small" text>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="actions-row">
      <div class="left-info">
        <el-button type="primary" link @click="addRow">+ 新增一期</el-button>
        <span class="summary-text">
          当前计划金额合计：
          <span :class="totalMismatch ? 'text-danger' : 'text-primary'">
            ¥{{ formatCurrency(totalPlannedAmount) }}
          </span>
          <span v-if="contractAmount">
            ，合同金额：¥{{ formatCurrency(contractAmount) }}，差额：
            <span :class="totalMismatch ? 'text-danger' : 'text-muted'">
              ¥{{ formatCurrency(contractAmount - totalPlannedAmount) }}
            </span>
          </span>
        </span>
      </div>
      <div class="right-actions">
        <el-button @click="resetFromProps">重置</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存计划</el-button>
      </div>
    </div>

    <!-- 关联发票弹窗 -->
    <el-dialog
      v-model="allocationDialogVisible"
      :title="`关联发票 · ${activePlanLabel}`"
      width="820px"
      :close-on-click-modal="false"
    >
      <div v-loading="allocationLoading">
        <div class="dialog-summary">
          计划金额：¥{{ formatCurrency(activePlanPlanned) }}
          ，已分摊：
          <span :class="allocatedMismatch ? 'text-danger' : 'text-primary'">
            ¥{{ formatCurrency(allocatedSum) }}
          </span>
          <span class="text-muted">（超出计划不阻止，状态将置为已开票）</span>
        </div>

        <el-table :data="allocationRows" border size="small" max-height="420">
          <el-table-column label="发票号" min-width="150">
            <template #default="scope">
              <span :class="scope.row.status === 'cancelled' ? 'text-muted' : ''">
                {{ scope.row.invoice_number }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="发票总额" width="120" align="right">
            <template #default="scope">¥{{ formatCurrency(scope.row.total_amount) }}</template>
          </el-table-column>
          <el-table-column label="其他计划已分摊" width="130" align="right">
            <template #default="scope">¥{{ formatCurrency(scope.row.allocated_elsewhere) }}</template>
          </el-table-column>
          <el-table-column label="计入本期" width="180">
            <template #header>
              <div class="col-header">
                <span>计入本期金额</span>
                <el-tooltip
                  placement="top"
                  content="这张发票有多少钱算作本期的开票额。一张发票可以拆到多期，各期金额之和不能超过发票总额；填 0 表示这张票不计入本期。"
                >
                  <el-icon class="help-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <template #default="scope">
              <el-input-number
                v-model="scope.row.allocated_amount"
                :min="0"
                :max="scope.row.total_amount - scope.row.allocated_elsewhere"
                :precision="2"
                size="small"
                :disabled="scope.row.status === 'cancelled'"
                style="width: 100%"
                @change="onAllocationAmountChange"
              />
            </template>
          </el-table-column>
          <el-table-column label="剩余可分摊" width="120" align="right">
            <template #header>
              <div class="col-header">
                <span>剩余可分摊</span>
                <el-tooltip
                  placement="top"
                  content="这张发票还没有分配给任何期的金额，即发票总额减去所有期已计入之和。"
                >
                  <el-icon class="help-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <template #default="scope">
              ¥{{ formatCurrency(scope.row.remaining - (scope.row.allocated_amount || 0)) }}
            </template>
          </el-table-column>
        </el-table>

        <div class="dialog-tip">
          填写示例：一张 ¥10,000 的发票若分两期各计一半，就在两期的弹窗里各填 ¥5,000。
          这里只影响「本期已开票金额」的统计，不改变发票本身金额，也不影响收款。
        </div>
      </div>

      <template #footer>
        <el-button @click="allocationDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="allocationSaving" @click="handleSaveAllocations">
          保存关联
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import { contractApi } from '@/api'
import type {
  ContractInvoicePlan,
  PlanAllocationDetail,
  AllocatableInvoice,
  PlanSideAllocationItem
} from '@/api/types'
import { useKitStore } from '@/stores/kit'

interface PlanFormItem {
  id?: number
  phase_name: string
  pay_ratio?: number | null           // 0-1，用于提交后端
  pay_ratio_percent?: number | null   // 0-100，界面显示/输入
  planned_amount: number
  planned_invoice_date?: string | null
  remind_days_before?: number | null
  actual_invoiced_amount?: number
  status?: ContractInvoicePlan['status']
  editMode?: 'ratio' | 'amount' | null
}

const props = defineProps<{
  contractId: number
  contractAmount: number
  plans: ContractInvoicePlan[]
}>()

const emit = defineEmits<{
  (e: 'updated'): void
}>()

const kitStore = useKitStore()
const router = useRouter()

const saving = ref(false)
const editablePlans = ref<PlanFormItem[]>([])

const formatCurrency = (amount: number) => {
  if (!amount) return '0'
  return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

const totalPlannedAmount = computed(() => {
  return editablePlans.value.reduce((sum, item) => sum + (Number(item.planned_amount) || 0), 0)
})

const contractAmount = computed(() => Number(props.contractAmount || 0))

const totalMismatch = computed(() => {
  if (!contractAmount.value) return false
  return Math.abs(contractAmount.value - totalPlannedAmount.value) > 0.01
})

const onRatioChange = (row: PlanFormItem) => {
  row.editMode = 'ratio'

  if (!contractAmount.value || row.pay_ratio_percent == null) {
    return
  }

  // 百分比转为小数存储
  row.pay_ratio = Number((row.pay_ratio_percent / 100).toFixed(4))

  // 比例 → 金额
  row.planned_amount = Number(
    (contractAmount.value * row.pay_ratio).toFixed(2)
  )
}

const onAmountChange = (row: PlanFormItem) => {
  row.editMode = 'amount'

  if (!contractAmount.value || row.planned_amount == null) {
    return
  }

  // 金额 → 比例（先算小数，再转成百分比显示）
  const ratio = row.planned_amount / contractAmount.value
  row.pay_ratio = Number(ratio.toFixed(4))
  row.pay_ratio_percent = Number((ratio * 100).toFixed(2))
}

const getStatusType = (status?: string) => {
  const map: Record<string, string> = {
    pending: 'info',
    partial_invoiced: 'warning',
    invoiced: 'success',
    cancelled: 'default',
    bad_debt: 'danger'
  }
  return (status && map[status]) || 'info'
}

const getStatusText = (status?: string) => {
  const map: Record<string, string> = {
    pending: '未开票',
    partial_invoiced: '部分开票',
    invoiced: '已开票',
    cancelled: '已取消',
    bad_debt: '坏账'
  }
  return (status && map[status]) || '未开票'
}

const resetFromProps = () => {
  editablePlans.value = (props.plans || []).map(p => ({
    id: p.id,
    phase_name: p.phase_name,
    // 后端存的是 0-1 的小数，这里转成 0-100 的百分比显示
    pay_ratio: p.pay_ratio ?? null,
    pay_ratio_percent: p.pay_ratio != null ? Number((p.pay_ratio * 100).toFixed(2)) : null,
    planned_amount: Number(p.planned_amount || 0),
    planned_invoice_date: p.planned_invoice_date || null,
    remind_days_before: p.remind_days_before ?? 0,
    actual_invoiced_amount: Number(p.actual_invoiced_amount || 0),
    status: p.status,
    editMode: null,
  }))
}

watch(
  () => props.plans,
  () => {
    resetFromProps()
  },
  { immediate: true, deep: true }
)

const addRow = () => {
  editablePlans.value.push({
    phase_name: `第${editablePlans.value.length + 1}期`,
    pay_ratio: null,
    pay_ratio_percent: null,
    planned_amount: 0,
    planned_invoice_date: undefined,
    remind_days_before: 0,
    status: 'pending',
    editMode: null,
  })
}

const handleDeleteRow = async (index: number, row: PlanFormItem) => {
  if (row.id) {
    try {
      const res = await contractApi.deleteContractInvoicePlan(
        props.contractId,
        row.id,
        { viewAll: kitStore.viewAllKits }
      )
      if (!res.success) {
        ElMessage.error(res.message || '删除失败')
        return
      }
      ElMessage.success('已删除该期开票计划')
      editablePlans.value.splice(index, 1)
      emit('updated')
      return
    } catch (error: any) {
      console.error('delete plan error', error)
      ElMessage.error(error?.message || '删除失败：该计划可能已关联发票')
      return
    }
  }
  editablePlans.value.splice(index, 1)
}

const handleSave = async () => {
  if (!editablePlans.value.length) {
    ElMessage.warning('请先添加至少一条开票计划')
    return
  }

  for (const p of editablePlans.value) {
    if (!p.phase_name) {
      ElMessage.warning('期数名称不能为空')
      return
    }
    if (!p.planned_amount || p.planned_amount <= 0) {
      ElMessage.warning('计划金额必须大于0')
      return
    }
  }

  try {
    saving.value = true
    const payload = editablePlans.value.map(p => ({
      id: p.id,
      phase_name: p.phase_name,
      // 提交给后端仍然用 0-1 的小数
      pay_ratio: p.pay_ratio ?? (p.pay_ratio_percent != null ? p.pay_ratio_percent / 100 : undefined),
      planned_amount: p.planned_amount,
      planned_invoice_date: p.planned_invoice_date || undefined,
      remind_days_before: p.remind_days_before ?? 0
    }))

    const res = await contractApi.saveContractInvoicePlans(
      props.contractId,
      payload,
      { viewAll: kitStore.viewAllKits }
    )

    if (!res.success) {
      ElMessage.error(res.message || '保存失败')
      return
    }

    ElMessage.success('开票计划保存成功')
    emit('updated')
  } catch (error: any) {
    console.error('save plans error', error)
    ElMessage.error(error?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// ---------------------------------------------------------------- 关联发票弹窗

const allocationDialogVisible = ref(false)
const allocationLoading = ref(false)
const allocationSaving = ref(false)
const activePlan = ref<PlanFormItem | null>(null)
const allocationRows = ref<
  Array<AllocatableInvoice & { allocated_amount: number }>
>([])

const activePlanLabel = computed(() => activePlan.value?.phase_name || '')
const activePlanPlanned = computed(() =>
  Number(activePlan.value?.planned_amount || 0)
)

const allocatedSum = computed(() =>
  allocationRows.value.reduce(
    (sum, row) => sum + (Number(row.allocated_amount) || 0),
    0
  )
)

const allocatedMismatch = computed(
  () => allocatedSum.value > activePlanPlanned.value + 0.01
)

const onAllocationAmountChange = () => {
  // 仅用于触发 computed 重算，实际校验在保存时进行
}

/**
 * 从某一期直接开票：把合同与该期信息带过去，
 * 发票表单会预填客户、合同、计划分摊金额与开票日期，只需上传附件即可完成
 */
const createInvoiceForPlan = (row: PlanFormItem) => {
  if (!row.id) {
    ElMessage.warning('请先保存该期计划后再开票')
    return
  }
  const remaining = Math.max(
    0,
    Number(row.planned_amount || 0) - Number(row.actual_invoiced_amount || 0)
  )
  router.push({
    path: '/invoices/create',
    query: {
      contractId: String(props.contractId),
      planId: String(row.id),
      amount: remaining > 0 ? remaining.toFixed(2) : undefined,
      issueDate: row.planned_invoice_date || undefined
    }
  })
}

const openAllocationDialog = async (row: PlanFormItem) => {
  if (!row.id) {
    ElMessage.warning('请先保存该期计划后再关联发票')
    return
  }
  activePlan.value = row
  allocationDialogVisible.value = true
  allocationLoading.value = true
  allocationRows.value = []
  try {
    const res = await contractApi.getAllocatableInvoices(
      props.contractId,
      row.id,
      { viewAll: kitStore.viewAllKits }
    )
    if (!res.success) {
      ElMessage.error(res.message || '获取可分摊发票失败')
      return
    }
    allocationRows.value = (res.data || []).map(invoice => ({
      ...invoice,
      allocated_amount: Number(invoice.allocated_this_plan || 0)
    }))
  } catch (error: any) {
    console.error('load allocatable invoices error', error)
    ElMessage.error(error?.message || '获取可分摊发票失败')
  } finally {
    allocationLoading.value = false
  }
}

const handleSaveAllocations = async () => {
  const planId = activePlan.value?.id
  if (!planId) return

  for (const row of allocationRows.value) {
    const amount = Number(row.allocated_amount) || 0
    if (amount < 0) {
      ElMessage.warning(`发票 ${row.invoice_number} 的分摊金额不能为负`)
      return
    }
    if (amount > row.remaining + 0.01) {
      ElMessage.warning(
        `发票 ${row.invoice_number} 超出可分摊额度 ¥${formatCurrency(row.remaining)}`
      )
      return
    }
  }

  const items: PlanSideAllocationItem[] = allocationRows.value
    .filter(row => Number(row.allocated_amount) > 0)
    .map(row => ({
      invoice_id: row.id,
      allocated_amount: Number(Number(row.allocated_amount).toFixed(2))
    }))

  try {
    allocationSaving.value = true
    const res = await contractApi.savePlanAllocations(
      props.contractId,
      planId,
      items
    )
    if (!res.success) {
      ElMessage.error(res.message || '保存失败')
      return
    }
    ElMessage.success('发票关联已保存')
    allocationDialogVisible.value = false
    emit('updated')
  } catch (error: any) {
    console.error('save plan allocations error', error)
    ElMessage.error(error?.message || '保存失败')
  } finally {
    allocationSaving.value = false
  }
}

const isOverAllocated = (row: PlanFormItem) =>
  Number(row.actual_invoiced_amount || 0) >
  Number(row.planned_amount || 0) + 0.01

const overAmount = (row: PlanFormItem) =>
  Number(row.actual_invoiced_amount || 0) - Number(row.planned_amount || 0)
</script>

<style scoped>
.invoice-plan-panel {
  margin-top: 8px;
}

.header {
  margin-bottom: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 12px;
  color: #909399;
}

.actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.left-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.summary-text {
  color: #606266;
}

.text-primary {
  color: #409eff;
}

.text-danger {
  color: #f56c6c;
}

.text-muted {
  color: #909399;
}

.right-actions {
  display: flex;
  gap: 8px;
}

.currency-symbol {
  font-size: 12px;
  color: #909399;
}

.mb-3 {
  margin-bottom: 12px;
}

.allocated-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.allocated-sep {
  color: #c0c4cc;
}

.over-tag {
  color: #f56c6c;
  font-size: 12px;
  margin-left: 4px;
}

.dialog-summary {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
}

.dialog-tip {
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}

.col-header {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.help-icon {
  color: #909399;
  cursor: help;
  font-size: 13px;
}
</style>
