<template>
  <div class="subscription-detail-container">
    <el-page-header :title="'返回列表'" @back="goBack">
      <template #content>
        <h2>订阅详情</h2>
      </template>
    </el-page-header>

    <el-card class="detail-card" v-loading="store.loading">
      <div class="detail-header">
        <div class="basic-info">
          <h3>{{ subscription?.name }}</h3>
          <p><strong>订阅起始日期：</strong>{{ subscription?.start_date || '未设置' }}</p>
          <p><strong>当前到期日：</strong>{{ subscription?.current_expiry_date || '未设置' }}</p>
          <p><strong>订阅时长：</strong>{{ durationLabel }}</p>
          <p><strong>事项类型：</strong>{{ subscription?.type?.name || '-' }}</p>
          <p><strong>所属主体：</strong>{{ subscription?.subject || '-' }}</p>
          <p><strong>服务商：</strong>{{ subscription?.provider || '-' }}</p>
          <p><strong>当前状态：</strong>
            <el-tag :type="subscription?.status === 'active' ? 'success' : 'info'">
              {{ subscription?.status === 'active' ? '已启用' : '已停用' }}
            </el-tag>
          </p>
        </div>
        <div class="actions">
          <el-button type="primary" @click="showRenewalDialog">+ 登记续费</el-button>
          <el-button @click="editSubscription">编辑</el-button>
          <el-popconfirm
            :title="`确定要${subscription?.status === 'active' ? '停用' : '恢复启用'}此项吗？`"
            @confirm="toggleStatus"
          >
            <template #reference>
              <el-button :type="subscription?.status === 'active' ? 'warning' : 'success'">
                {{ subscription?.status === 'active' ? '停用此项' : '恢复启用' }}
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </el-card>

    <!-- 续费记录表格 -->
    <el-card class="renewal-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">续费记录</span>
        </div>
      </template>
      <el-table 
        :data="renewalLogs" 
        v-loading="store.loading" 
        style="width: 100%" 
        stripe
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="renewal_date" label="续费日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.renewal_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="next_reminder_date" label="下次提醒时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.next_reminder_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="remind_days_before" label="提前提醒天数" width="120" />
        <el-table-column prop="reminder_mode" label="提醒方式" width="100">
          <template #default="{ row }">
            {{ row.reminder_mode === 'daily' ? '每日提醒' : '仅提醒一次' }}
          </template>
        </el-table-column>
        <el-table-column prop="fee" label="费用" width="100">
          <template #default="{ row }">
            {{ row.fee ? `¥${Number(row.fee).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="renewal_method" label="续费方式" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link v-if="isHttpUrl(row.renewal_method)" type="primary" :href="row.renewal_method || ''" target="_blank">{{ row.renewal_method }}</el-link>
            <span v-else>{{ row.renewal_method || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remarks" label="备注" show-overflow-tooltip />
        <el-table-column prop="operator.username" label="操作人" width="100" />
        <el-table-column prop="created_at" label="操作时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="附件" width="150">
          <template #default="{ row }">
            <el-button 
              size="small" 
              type="primary" 
              link
              @click="expandRow(row)"
            >
              {{ expandedRowId === row.id ? '收起' : '展开' }} ({{ getAttachmentCount(row) }})
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="editRenewalRecord(row)">编辑</el-button>
            <el-button size="small" link type="danger" @click="deleteRenewalRecord(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 展开行 - 附件管理 -->
      <el-table 
        v-show="expandedRowId"
        :data="expandedAttachments" 
        style="width: 100%; margin-top: 10px;" 
        :show-header="false"
        v-loading="attachmentsLoading"
      >
        <el-table-column width="50" />
        <el-table-column label="附件类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.attachment_type === 'contract' ? 'warning' : 'success'">
              {{ row.attachment_type === 'contract' ? '合同' : '发票' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="file_name" label="文件名" show-overflow-tooltip />
        <el-table-column prop="file_size" label="大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.file_size) }}
          </template>
        </el-table-column>
        <el-table-column prop="uploaded_at" label="上传时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.uploaded_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="previewAttachment(row)">预览</el-button>
            <el-button size="small" @click="downloadAttachment(row)">下载</el-button>
            <el-button size="small" type="danger" @click="deleteAttachment(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑订阅对话框 -->
    <el-dialog title="编辑订阅" v-model="subscriptionDialogVisible" width="600px" destroy-on-close>
      <el-form :model="subscriptionForm" :rules="subscriptionRules" ref="subscriptionFormRef" label-width="100px" :disabled="subscriptionSubmitting">
        <el-form-item label="事项名称" prop="name">
          <el-input v-model="subscriptionForm.name" placeholder="请输入事项名称" />
        </el-form-item>
        <el-form-item label="事项类型" prop="type_id">
          <el-select v-model="subscriptionForm.type_id" placeholder="请选择事项类型" style="width: 100%">
            <el-option v-for="type in store.subscriptionTypes" :key="type.id" :label="type.name" :value="type.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属主体" prop="subject">
          <el-input v-model="subscriptionForm.subject" placeholder="请输入所属主体" />
        </el-form-item>
        <el-form-item label="服务商">
          <el-input v-model="subscriptionForm.provider" placeholder="请输入服务商" />
        </el-form-item>
        <el-form-item label="订阅起始日期">
          <el-date-picker v-model="subscriptionForm.start_date" value-format="YYYY-MM-DD" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="当前到期日">
          <el-date-picker v-model="subscriptionForm.current_expiry_date" value-format="YYYY-MM-DD" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="续费周期">
          <el-input-number v-model="subscriptionForm.renewal_period_value" :min="1" style="width: 48%" />
          <el-select v-model="subscriptionForm.renewal_period_unit" style="width: 48%; margin-left: 4%">
            <el-option label="天" value="day" />
            <el-option label="月" value="month" />
            <el-option label="年" value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="提醒开始日">
          <el-date-picker v-model="subscriptionForm.next_reminder_start_date" value-format="YYYY-MM-DD" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="提前提醒天数">
          <el-input-number v-model="subscriptionForm.remind_days_before" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="主负责人">
          <el-input v-model="subscriptionForm.owner_name" placeholder="请输入主负责人姓名" />
        </el-form-item>
        <el-form-item label="其他负责人">
          <el-input v-model="subscriptionForm.cc_names" type="textarea" :rows="2" placeholder="请输入其他负责人姓名，多个用逗号分隔" />
        </el-form-item>
        <el-form-item label="费用">
          <el-input-number v-model="subscriptionForm.fee" :precision="2" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="subscriptionForm.notes" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="subscriptionForm.status" :active-value="'active'" :inactive-value="'inactive'" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subscriptionDialogVisible = false" :disabled="subscriptionSubmitting">取消</el-button>
        <el-button type="primary" @click="submitSubscriptionForm" :loading="subscriptionSubmitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 登记续费对话框 -->
    <el-dialog 
      :title="editingRenewalRecord ? '编辑续费记录' : '登记续费'" 
      v-model="renewalDialogVisible" 
      width="700px"
      destroy-on-close
    >
      <el-form 
        :model="renewalForm" 
        :rules="renewalRules" 
        ref="renewalFormRef"
        label-width="120px"
        :disabled="renewalSubmitting"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="续费日期">
              <el-date-picker
                v-model="renewalForm.renewal_date"
                type="date"
                placeholder="选择续费日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="下次提醒时间" prop="next_reminder_date">
              <el-date-picker
                v-model="renewalForm.next_reminder_date"
                type="date"
                placeholder="选择下次提醒时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="提前提醒天数">
              <el-input-number 
                v-model="renewalForm.remind_days_before" 
                :min="0" 
                :max="365" 
                placeholder="提前天数"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提醒方式">
              <el-select v-model="renewalForm.reminder_mode" placeholder="选择提醒方式" style="width: 100%">
                <el-option label="每日提醒" value="daily" />
                <el-option label="仅提醒一次" value="once" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="费用">
              <el-input-number 
                v-model="renewalForm.fee" 
                :precision="2" 
                :step="100" 
                placeholder="费用金额"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="续费方式">
              <el-input 
                v-model="renewalForm.renewal_method" 
                placeholder="续费方式，如：个人代付，发票报销"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input 
            v-model="renewalForm.remarks" 
            type="textarea"
            :rows="3"
            placeholder="备注信息" 
          />
        </el-form-item>
        <el-form-item label="合同附件">
          <el-upload
            :auto-upload="false"
            :show-file-list="true"
            :on-change="(file) => handleFileChange(file, 'contract')"
            :before-remove="() => !renewalSubmitting"
            :disabled="renewalSubmitting"
          >
            <el-button slot="trigger" size="small" type="primary">选取文件</el-button>
          </el-upload>
          <div v-if="contractFile" class="file-info">
            {{ contractFile.name }} ({{ formatFileSize(contractFile.size) }})
            <el-button size="small" type="danger" @click="removeFile('contract')">删除</el-button>
          </div>
        </el-form-item>
        <el-form-item label="发票附件">
          <el-upload
            :auto-upload="false"
            :show-file-list="true"
            :on-change="(file) => handleFileChange(file, 'invoice')"
            :before-remove="() => !renewalSubmitting"
            :disabled="renewalSubmitting"
          >
            <el-button slot="trigger" size="small" type="primary">选取文件</el-button>
          </el-upload>
          <div v-if="invoiceFile" class="file-info">
            {{ invoiceFile.name }} ({{ formatFileSize(invoiceFile.size) }})
            <el-button size="small" type="danger" @click="removeFile('invoice')">删除</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renewalDialogVisible = false" :disabled="renewalSubmitting">取消</el-button>
        <el-button type="primary" @click="submitRenewalForm" :loading="renewalSubmitting">
          {{ editingRenewalRecord ? '更新' : '登记' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSubscriptionStore } from '@/stores/subscription'
import { subscriptionApi } from '@/api/subscription'
import type { Subscription, SubscriptionRenewalRecord, SubscriptionRenewalAttachment } from '@/api/types'
import { formatSubscriptionDuration } from '@/utils/subscription-duration'

const router = useRouter()
const route = useRoute()
const store = useSubscriptionStore()

const subscriptionId = computed(() => Number(route.params.id))

const subscription = computed(() => store.currentSubscription)
const renewalLogs = computed(() => store.renewalLogs)
const durationLabel = computed(() => formatSubscriptionDuration(subscription.value?.start_date, subscription.value?.current_expiry_date))

const renewalDialogVisible = ref(false)
const renewalSubmitting = ref(false)
const editingRenewalRecord = ref(false)
const editingRenewalRecordId = ref<number | null>(null)
const renewalFormRef = ref()
const expandedRowId = ref<number | null>(null)
const attachmentsLoading = ref(false)
const expandedAttachments = ref<SubscriptionRenewalAttachment[]>([])

const subscriptionDialogVisible = ref(false)
const subscriptionSubmitting = ref(false)
const subscriptionFormRef = ref()
const subscriptionForm = reactive<Partial<Subscription>>({
  type_id: undefined,
  name: '',
  subject: '',
  provider: null,
  start_date: null,
  current_expiry_date: '',
  next_reminder_start_date: null,
  renewal_period_value: 1,
  renewal_period_unit: 'month',
  remind_days_before: 30,
  reminder_mode: 'daily',
  owner_name: null,
  cc_names: null,
  fee: null,
  notes: null,
  status: 'active'
})

const renewalForm = reactive({
  renewal_date: null as string | null,
  next_reminder_date: null as string | null,
  remind_days_before: 0,
  reminder_mode: 'daily' as 'daily' | 'once',
  fee: null as number | null,
  renewal_method: null as string | null,
  remarks: null as string | null,
  status: 'active' as 'active' | 'completed' | 'voided'
})

const contractFile = ref<File | null>(null)
const invoiceFile = ref<File | null>(null)

const renewalRules = {
  next_reminder_date: [{ required: true, message: '请选择下次提醒时间', trigger: 'change' }]
}

const subscriptionRules = {
  name: [{ required: true, message: '请输入事项名称', trigger: 'blur' }],
  type_id: [{ required: true, message: '请选择事项类型', trigger: 'change' }],
  subject: [{ required: true, message: '请输入所属主体', trigger: 'blur' }]
}

const goBack = () => {
  router.push('/subscriptions')
}

const editSubscription = () => {
  if (!subscription.value) return
  Object.assign(subscriptionForm, {
    type_id: subscription.value.type_id,
    name: subscription.value.name,
    subject: subscription.value.subject,
    provider: subscription.value.provider,
    start_date: subscription.value.start_date ? String(subscription.value.start_date).split('T')[0] : null,
    current_expiry_date: subscription.value.current_expiry_date ? String(subscription.value.current_expiry_date).split('T')[0] : '',
    next_reminder_start_date: subscription.value.next_reminder_start_date ? String(subscription.value.next_reminder_start_date).split('T')[0] : null,
    renewal_period_value: subscription.value.renewal_period_value,
    renewal_period_unit: subscription.value.renewal_period_unit,
    remind_days_before: subscription.value.remind_days_before,
    reminder_mode: subscription.value.reminder_mode || 'daily',
    owner_name: subscription.value.owner_name,
    cc_names: subscription.value.cc_names,
    fee: subscription.value.fee,
    notes: subscription.value.notes,
    status: subscription.value.status
  })
  subscriptionDialogVisible.value = true
}

const submitSubscriptionForm = async () => {
  await subscriptionFormRef.value.validate()
  subscriptionSubmitting.value = true
  try {
  if (subscriptionForm.start_date && subscriptionForm.current_expiry_date && subscriptionForm.start_date > subscriptionForm.current_expiry_date) {
    ElMessage.error('订阅起始日期不能晚于当前到期日')
    return
  }
    const response = await store.updateSubscription(subscriptionId.value, { ...subscriptionForm })
    if (response.success) {
      ElMessage.success('订阅更新成功')
      subscriptionDialogVisible.value = false
      await store.fetchSubscription(subscriptionId.value)
      await store.fetchRenewalLogs(subscriptionId.value)
    } else {
      ElMessage.error(response.message || '订阅更新失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '订阅更新失败')
  } finally {
    subscriptionSubmitting.value = false
  }
}

const toggleStatus = async () => {
  if (subscription.value?.status === 'active') {
    await store.disableSubscription(subscriptionId.value)
    ElMessage.success('停用成功')
  } else {
    await store.enableSubscription(subscriptionId.value)
    ElMessage.success('启用成功')
  }
  await store.fetchSubscription(subscriptionId.value)
}

const showRenewalDialog = () => {
  editingRenewalRecord.value = false
  editingRenewalRecordId.value = null
  Object.assign(renewalForm, {
    renewal_date: null,
    next_reminder_date: null,
    remind_days_before: 0,
    reminder_mode: 'daily',
    fee: null,
    renewal_method: null,
    remarks: null,
    status: 'active'
  })
  contractFile.value = null
  invoiceFile.value = null
  renewalDialogVisible.value = true
}

const editRenewalRecord = (row: SubscriptionRenewalRecord) => {
  editingRenewalRecord.value = true
  editingRenewalRecordId.value = row.id
  Object.assign(renewalForm, {
    renewal_date: row.renewal_date,
    next_reminder_date: row.next_reminder_date,
    remind_days_before: row.remind_days_before,
    reminder_mode: row.reminder_mode,
    fee: row.fee,
    renewal_method: row.renewal_method,
    remarks: row.remarks,
    status: row.status
  })
  contractFile.value = null
  invoiceFile.value = null
  renewalDialogVisible.value = true
}

const submitRenewalForm = async () => {
  await renewalFormRef.value.validate()
  renewalSubmitting.value = true
  
  try {
    let response
    if (editingRenewalRecord.value) {
      if (!editingRenewalRecordId.value) {
        throw new Error('缺少正在编辑的续费记录ID')
      }
      response = await subscriptionApi.updateRenewalRecord(editingRenewalRecordId.value, { ...renewalForm })
    } else {
      response = await subscriptionApi.createRenewalRecord(subscriptionId.value, { ...renewalForm })
    }
    
    if (response.success) {
      ElMessage.success(editingRenewalRecord.value ? '更新续费记录成功' : '登记续费成功')
      renewalDialogVisible.value = false
      
      const recordId = editingRenewalRecord.value ? editingRenewalRecordId.value! : response.data!.id
      if (contractFile.value) {
        await uploadRenewalAttachment(recordId, 'contract', contractFile.value)
      }
      if (invoiceFile.value) {
        await uploadRenewalAttachment(recordId, 'invoice', invoiceFile.value)
      }
      
      await store.fetchRenewalLogs(subscriptionId.value)
      if (expandedRowId.value === recordId) {
        await loadAttachments(recordId)
      }
    } else {
      ElMessage.error(response.message || (editingRenewalRecord.value ? '更新续费记录失败' : '登记续费失败'))
    }
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    renewalSubmitting.value = false
  }
}

const deleteRenewalRecord = async (row: SubscriptionRenewalRecord) => {
  await ElMessageBox.confirm('确定删除这条续费记录吗？其名下合同/发票附件也会一并删除，但不会自动回滚当前订阅到期日。', '删除续费记录', { type: 'warning' })
  const response = await subscriptionApi.deleteRenewalRecord(row.id)
  if (response.success) {
    ElMessage.success('续费记录已删除')
    store.fetchRenewalLogs(subscriptionId.value)
  } else {
    ElMessage.error(response.message || '删除失败')
  }
}

const loadAttachments = async (recordId: number) => {
  attachmentsLoading.value = true
  try {
    const response = await subscriptionApi.getRenewalRecordAttachments(recordId)
    expandedAttachments.value = response.data || []
    const row = store.renewalLogs.find(log => log.id === recordId)
    if (row) {
      row.attachments = expandedAttachments.value
    }
  } catch (error) {
    console.error('获取附件失败:', error)
    expandedAttachments.value = []
  } finally {
    attachmentsLoading.value = false
  }
}

const expandRow = async (row: SubscriptionRenewalRecord) => {
  if (expandedRowId.value === row.id) {
    expandedRowId.value = null
    expandedAttachments.value = []
    return
  }

  expandedRowId.value = row.id
  await loadAttachments(row.id)
}

const getAttachmentCount = (row: SubscriptionRenewalRecord) => {
  return (row.attachments?.length || 0)
}

const tableRowClassName = ({ row }: { row: SubscriptionRenewalRecord }) => {
  if (row.status === 'active') {
    return 'active-row'
  }
  return ''
}

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'completed': return 'info'
    case 'voided': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '生效中'
    case 'completed': return '已完成'
    case 'voided': return '已作废'
    default: return status
  }
}

const formatDate = (value?: string) => value ? String(value).split('T')[0] : '-'
const isHttpUrl = (value?: string | null) => /^https?:\/\/.+/.test(value || '')
const formatFileSize = (bytes?: number) => {
  if (bytes === undefined || bytes === null) return '-'
  if (bytes < 1024) return bytes + ' B'
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  else return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const handleFileChange = (file: any, type: 'contract' | 'invoice') => {
  if (type === 'contract') {
    contractFile.value = file.raw
  } else {
    invoiceFile.value = file.raw
  }
}

const removeFile = (type: 'contract' | 'invoice') => {
  if (type === 'contract') {
    contractFile.value = null
  } else {
    invoiceFile.value = null
  }
}

const uploadRenewalAttachment = async (recordId: number, attachmentType: 'contract' | 'invoice', file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await subscriptionApi.uploadAttachment(recordId, attachmentType, formData)
  if (!response.success) {
    throw new Error(response.message || '附件上传失败')
  }
}

const previewAttachment = (attachment: SubscriptionRenewalAttachment) => {
  window.open(`/api/v1/subscriptions/attachments/${attachment.attachment_id}/preview`, '_blank')
}

const downloadAttachment = (attachment: SubscriptionRenewalAttachment) => {
  const link = document.createElement('a')
  link.href = `/api/v1/subscriptions/attachments/${attachment.attachment_id}/preview`
  link.download = attachment.file_name
  link.click()
}

const deleteAttachment = async (attachment: SubscriptionRenewalAttachment) => {
  await ElMessageBox.confirm('确定删除这个附件吗？', '删除附件', { type: 'warning' })
  const response = await store.deleteRenewalAttachment(attachment.attachment_id)
  if (response.success) {
    ElMessage.success('附件已删除')
    if (expandedRowId.value) {
      await loadAttachments(expandedRowId.value)
    }
  } else {
    ElMessage.error(response.message || '删除失败')
  }
}

onMounted(async () => {
  await store.fetchSubscriptionTypes()
  await store.fetchSubscription(subscriptionId.value)
  await store.fetchRenewalLogs(subscriptionId.value)
})
</script>

<style scoped>
.subscription-detail-container {
  padding: 20px;
}

.detail-card {
  margin-bottom: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
}

.basic-info h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.basic-info p {
  margin: 5px 0;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
}

.renewal-card {
  margin-bottom: 20px;
}

.file-info {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

:deep(.active-row) {
  background-color: #f0f9ff;
}
</style>