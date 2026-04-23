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
          <div>2）计划保存后，发票可选择关联对应期数，系统会自动统计每期的开票完成情况；</div>
          <div>3）提醒天数用于后续的开票提醒列表（本次仅存字段，不做提醒功能）。</div>
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

      <el-table-column label="操作" width="120" fixed="right">
        <template #default="scope">
          <el-popconfirm
            title="确认删除该期开票计划？若已关联发票会删除失败。"
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { contractApi } from '@/api'
import type { ContractInvoicePlan } from '@/api/types'
import { useKitStore } from '@/stores/kit'

interface PlanFormItem {
  id?: number
  phase_name: string
  pay_ratio?: number | null           // 0-1，用于提交后端
  pay_ratio_percent?: number | null   // 0-100，界面显示/输入
  planned_amount: number
  planned_invoice_date?: string | null
  remind_days_before?: number | null
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
</style>
