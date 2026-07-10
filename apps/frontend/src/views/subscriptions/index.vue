<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">订阅台账</h2>
        <p class="page-subtitle">统一管理认证、云服务、SSL 证书等有效期事项</p>
      </div>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新增订阅
      </el-button>
    </div>

    <div class="summary-grid">
      <el-card shadow="never">
        <div class="summary-item"><span>全部订阅</span><strong>{{ store.total }}</strong></div>
      </el-card>
      <el-card shadow="never">
        <div class="summary-item warning"><span>临期</span><strong>{{ store.expiringCount }}</strong></div>
      </el-card>
      <el-card shadow="never">
        <div class="summary-item danger"><span>逾期</span><strong>{{ store.overdueCount }}</strong></div>
      </el-card>
    </div>

    <div class="table-container">
      <div class="table-toolbar">
        <div class="table-search">
          <el-input v-model="filters.search" placeholder="搜索事项名称/主体/供应商" style="width: 260px" clearable @change="loadData" />
          <el-select v-model="filters.type_id" placeholder="事项类型" style="width: 160px" clearable @change="loadData">
            <el-option v-for="type in store.types" :key="type.id" :label="type.name" :value="type.id" />
          </el-select>
          <el-input v-model="filters.owner_name" placeholder="负责人" style="width: 160px" clearable @change="loadData" />
          <el-segmented v-model="filters.expiry_status" :options="expiryOptions" @change="loadData" />
        </div>
      </div>

      <el-table v-loading="store.loading" :data="store.subscriptions" style="width: 100%" @sort-change="handleSortChange">
        <el-table-column prop="name" label="事项名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" @click="$router.push(`/subscriptions/${row.id}`)">{{ row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="type.name" label="类型" width="120" />
        <el-table-column prop="subject" label="所属主体" min-width="160" show-overflow-tooltip />
        <el-table-column prop="provider" label="服务商" width="120" show-overflow-tooltip />
        <el-table-column prop="current_expiry_date" label="到期日" width="130" sortable="custom" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getExpiryTagType(row)">{{ getExpiryText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="续费周期" width="120">
          <template #default="{ row }">{{ row.renewal_period_value }}{{ unitLabel[row.renewal_period_unit] }}</template>
        </el-table-column>
        <el-table-column label="负责人" width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.owner_name || row.owner?.full_name || row.owner?.username || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="当前状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status === 'active' ? '已启用' : '已停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editSubscription(row)">编辑</el-button>
            <el-button size="small" type="success" @click="openRenewDialog(row)">已续费</el-button>
            <el-button v-if="row.status !== 'active'" size="small" type="primary" @click="enable(row)">恢复启用</el-button>
            <el-button v-else size="small" type="warning" @click="disable(row)">停用此项</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="store.page"
          v-model:page-size="store.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="store.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <el-dialog v-model="renewalDialogVisible" title="确认续费" width="560px" destroy-on-close>
      <el-form label-width="110px">
        <el-form-item label="续费事项">
          <span>{{ renewingRow?.name }}</span>
        </el-form-item>
        <el-form-item label="续费备注">
          <el-input v-model="renewalForm.remarks" type="textarea" :rows="3" placeholder="可填写续约说明、金额、周期等" />
        </el-form-item>
        <el-form-item label="续约合同">
          <el-upload v-model:file-list="contractFiles" :auto-upload="false" :limit="1" accept=".pdf,.jpg,.jpeg,.png">
            <el-button>选择合同附件</el-button>
            <template #tip><div class="el-upload__tip">可选，可后补。支持 PDF、JPG、JPEG、PNG，最大 10MB</div></template>
          </el-upload>
        </el-form-item>
        <el-form-item label="续约发票">
          <el-upload v-model:file-list="invoiceFiles" :auto-upload="false" :limit="1" accept=".pdf,.jpg,.jpeg,.png">
            <el-button>选择发票附件</el-button>
            <template #tip><div class="el-upload__tip">可选，可等发票拿到后再补传</div></template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renewalDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="renewing" @click="submitRenewal">确认续费</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑订阅' : '新增订阅'" width="720px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="事项名称" prop="name"><el-input v-model="form.name" placeholder="例如：企业微信认证、阿里云服务器" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="事项类型" prop="type_id"><el-select v-model="form.type_id" style="width: 100%"><el-option v-for="type in store.types" :key="type.id" :label="type.name" :value="type.id" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="所属主体" prop="subject"><el-input v-model="form.subject" placeholder="公司名、域名、账号或公众号名称" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="服务商"><el-input v-model="form.provider" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="当前到期日" prop="current_expiry_date"><el-date-picker v-model="form.current_expiry_date" value-format="YYYY-MM-DD" type="date" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="下次提醒开始日"><el-date-picker v-model="form.next_reminder_start_date" value-format="YYYY-MM-DD" type="date" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="周期数值" prop="renewal_period_value"><el-input-number v-model="form.renewal_period_value" :min="1" controls-position="right" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="周期单位" prop="renewal_period_unit"><el-select v-model="form.renewal_period_unit" style="width: 100%"><el-option label="天" value="day" /><el-option label="月" value="month" /><el-option label="年" value="year" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="提前提醒天数" prop="remind_days_before"><el-input-number v-model="form.remind_days_before" :min="0" controls-position="right" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="提醒方式"><el-radio-group v-model="form.reminder_mode"><el-radio-button label="daily">每日提醒</el-radio-button><el-radio-button label="once">只提醒一次</el-radio-button></el-radio-group></el-form-item></el-col>
          <el-col :span="24">
            <el-card class="reminder-preview" shadow="never">
              <template #header>近 5 次提醒计划（仅用于提醒，不影响续费附件归档）</template>
              <el-table :data="reminderPreview" size="small" style="width: 100%">
                <el-table-column prop="index" label="次数" width="70" />
                <el-table-column prop="reminderText" label="提醒日期" min-width="240" />
                <el-table-column prop="expiryText" label="预计到期日" min-width="150" />
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="12"><el-form-item label="主负责人" prop="owner_name"><el-input v-model="form.owner_name" placeholder="手工输入负责人姓名" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="其他负责人"><el-input v-model="form.cc_names" placeholder="多个负责人可用顿号、逗号或空格分隔" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="费用"><el-input-number v-model="form.fee" :min="0" :precision="2" controls-position="right" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="续费方式"><el-input v-model="form.renewal_url" placeholder="续费链接、线下转账、服务商后台等" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.notes" type="textarea" :rows="3" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadUserFile } from 'element-plus'
import { useSubscriptionStore } from '@/stores/subscription'
import type { SubscriptionRecord, CreateSubscriptionDto } from '@/api/types'

const store = useSubscriptionStore()
const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const renewalDialogVisible = ref(false)
const renewing = ref(false)
const renewingRow = ref<SubscriptionRecord | null>(null)
const contractFiles = ref<UploadUserFile[]>([])
const invoiceFiles = ref<UploadUserFile[]>([])
const renewalForm = reactive({ remarks: '' })

const filters = reactive({
  search: '',
  type_id: undefined as number | undefined,
  owner_name: '',
  expiry_status: '' as '' | 'normal' | 'expiring' | 'overdue',
  sortBy: 'current_expiry_date',
  sortOrder: 'ASC' as 'ASC' | 'DESC'
})

const unitLabel = { day: '天', month: '月', year: '年' }
const expiryOptions = [
  { label: '全部', value: '' },
  { label: '正常', value: 'normal' },
  { label: '临期', value: 'expiring' },
  { label: '逾期', value: 'overdue' }
]

const defaultForm = (): CreateSubscriptionDto => ({
  type_id: 0,
  name: '',
  subject: '',
  provider: '',
  renewal_url: '',
  current_expiry_date: '',
  next_reminder_start_date: '',
  renewal_period_value: 1,
  renewal_period_unit: 'year',
  remind_days_before: 30,
  reminder_mode: 'daily',
  owner_name: '',
  owner_user_id: undefined,
  cc_names: '',
  cc_user_ids: [],
  fee: undefined,
  notes: '',
  status: 'active'
})
const form = reactive<CreateSubscriptionDto>(defaultForm())
const rules: FormRules = {
  name: [{ required: true, message: '请输入事项名称', trigger: 'blur' }],
  type_id: [{ required: true, message: '请选择事项类型', trigger: 'change' }],
  subject: [{ required: true, message: '请输入主体', trigger: 'blur' }],
  current_expiry_date: [{ required: true, message: '请选择当前到期日', trigger: 'change' }],
  owner_name: [{ required: true, message: '请输入主负责人', trigger: 'blur' }]
}

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const formatWeekDate = (dateText: string) => {
  const [year, month, day] = dateText.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return `${dateText} ${weekDays[date.getDay()]}`
}

const addPeriod = (dateText: string, value: number, unit: 'day' | 'month' | 'year', times = 1) => {
  if (!dateText || !value) return ''
  const [year, month, day] = dateText.split('-').map(Number)
  if (!year || !month || !day) return ''
  const date = new Date(year, month - 1, day)
  const amount = value * times
  if (unit === 'day') {
    date.setDate(date.getDate() + amount)
  } else if (unit === 'month') {
    const targetMonth = month - 1 + amount
    const lastDay = new Date(year, targetMonth + 1, 0).getDate()
    date.setFullYear(year, targetMonth, Math.min(day, lastDay))
  } else {
    const targetYear = year + amount
    const lastDay = new Date(targetYear, month, 0).getDate()
    date.setFullYear(targetYear, month - 1, Math.min(day, lastDay))
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const addDays = (dateText: string, days: number) => {
  if (!dateText) return ''
  const [year, month, day] = dateText.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const defaultReminderStartDate = computed(() => addDays(form.current_expiry_date, -Number(form.remind_days_before || 0)))
const reminderPreview = computed(() => {
  if (!form.current_expiry_date || !form.renewal_period_value) return []
  return Array.from({ length: 5 }, (_, index) => {
    const expiryDate = index === 0 ? form.current_expiry_date : addPeriod(form.current_expiry_date, form.renewal_period_value, form.renewal_period_unit, index)
    const reminderDate = index === 0 ? (form.next_reminder_start_date || defaultReminderStartDate.value) : addDays(expiryDate, -Number(form.remind_days_before || 0))
    const reminderText = form.reminder_mode === 'once'
      ? formatWeekDate(reminderDate)
      : `${formatWeekDate(reminderDate)} 起，每天提醒至 ${formatWeekDate(expiryDate)}`
    return {
      index: `第 ${index + 1} 次`,
      reminderText,
      expiryText: formatWeekDate(expiryDate)
    }
  })
})

const loadData = async () => {
  await store.fetchSubscriptions({ ...filters, expiry_status: filters.expiry_status || undefined })
}


const openCreateDialog = () => {
  editingId.value = null
  Object.assign(form, defaultForm(), { type_id: store.types[0]?.id || 0, current_expiry_date: new Date().toISOString().slice(0, 10), next_reminder_start_date: new Date().toISOString().slice(0, 10) })
  dialogVisible.value = true
}

const editSubscription = (row: SubscriptionRecord) => {
  editingId.value = row.id
  Object.assign(form, {
    type_id: row.type_id,
    name: row.name,
    subject: row.subject,
    provider: row.provider || '',
    renewal_url: row.renewal_url || '',
    current_expiry_date: String(row.current_expiry_date).split('T')[0],
    next_reminder_start_date: row.next_reminder_start_date ? String(row.next_reminder_start_date).split('T')[0] : addDays(String(row.current_expiry_date).split('T')[0], -Number(row.remind_days_before || 0)),
    renewal_period_value: row.renewal_period_value,
    renewal_period_unit: row.renewal_period_unit,
    remind_days_before: row.remind_days_before,
    reminder_mode: row.reminder_mode || 'daily',
    owner_name: row.owner_name || row.owner?.full_name || row.owner?.username || '',
    owner_user_id: row.owner_user_id || undefined,
    cc_names: row.cc_names || '',
    cc_user_ids: row.cc_user_id_list || parseCcUserIds(row.cc_user_ids),
    fee: row.fee || undefined,
    notes: row.notes || '',
    status: 'active'
  })
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value?.validate()
  saving.value = true
  try {
    const payload = { ...form, next_reminder_start_date: form.next_reminder_start_date || defaultReminderStartDate.value, status: form.status || 'active' }
    if (editingId.value) {
      await store.updateSubscription(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await store.createSubscription(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

const openRenewDialog = (row: SubscriptionRecord) => {
  renewingRow.value = row
  renewalForm.remarks = ''
  contractFiles.value = []
  invoiceFiles.value = []
  renewalDialogVisible.value = true
}

const submitRenewal = async () => {
  if (!renewingRow.value) return
  renewing.value = true
  try {
    const result = await store.renewSubscription(renewingRow.value.id, { remarks: renewalForm.remarks })
    const renewalLogId = (result as any)?.renewal_log?.id
    if (renewalLogId) {
      const contractFile = contractFiles.value[0]?.raw
      const invoiceFile = invoiceFiles.value[0]?.raw
      if (contractFile) {
        await store.uploadRenewalAttachment(renewalLogId, 'contract', contractFile)
      }
      if (invoiceFile) {
        await store.uploadRenewalAttachment(renewalLogId, 'invoice', invoiceFile)
      }
    }
    ElMessage.success('已续费，续约附件已保存')
    renewalDialogVisible.value = false
    await loadData()
  } finally {
    renewing.value = false
  }
}

const disable = async (row: SubscriptionRecord) => {
  await ElMessageBox.confirm(`确定停用「${row.name}」吗？停用后不再推送提醒。`, '停用此项', { type: 'warning' })
  await store.disableSubscription(row.id)
  ElMessage.success('已停用')
  await loadData()
}

const enable = async (row: SubscriptionRecord) => {
  await store.enableSubscription(row.id)
  ElMessage.success('已启用')
  await loadData()
}

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  filters.sortBy = prop || 'current_expiry_date'
  filters.sortOrder = order === 'descending' ? 'DESC' : 'ASC'
  loadData()
}

const parseCcUserIds = (value?: string | null) => value ? value.split(',').map(Number).filter(Boolean) : []
const getExpiryTagType = (row: SubscriptionRecord) => row.expiryStatus === 'overdue' ? 'danger' : row.expiryStatus === 'expiring' ? 'warning' : 'success'
const getExpiryText = (row: SubscriptionRecord) => {
  if (row.expiryStatus === 'overdue') return `已逾期 ${Math.abs(row.daysUntilExpiry || 0)} 天`
  if (row.expiryStatus === 'expiring') return `剩余 ${row.daysUntilExpiry} 天`
  return '正常'
}

onMounted(async () => {
  await store.fetchTypes()
  await loadData()
})
</script>

<style scoped>
.page-subtitle { color: #64748b; margin: 4px 0 0; }
.summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
.summary-item { display: flex; justify-content: space-between; align-items: center; color: #64748b; }
.summary-item strong { font-size: 28px; color: #1e293b; }
.summary-item.warning strong { color: #d97706; }
.summary-item.danger strong { color: #dc2626; }
.pagination-container { display: flex; justify-content: flex-end; padding-top: 16px; }
.reminder-preview { margin-bottom: 16px; }
@media (max-width: 768px) { .summary-grid { grid-template-columns: 1fr; } }
</style>
