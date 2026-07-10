<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">订阅详情</h2>
        <p v-if="subscription" class="page-subtitle">{{ subscription.name }}</p>
      </div>
      <div>
        <el-button @click="$router.push('/subscriptions')">返回台账</el-button>
        <el-button v-if="subscription?.status === 'active'" type="success" @click="openRenewDialog">已续费</el-button>
      </div>
    </div>

    <el-card v-loading="store.loading" shadow="never" v-if="subscription">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="事项名称">{{ subscription.name }}</el-descriptions-item>
        <el-descriptions-item label="事项类型">{{ subscription.type?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所属主体">{{ subscription.subject }}</el-descriptions-item>
        <el-descriptions-item label="服务商">{{ subscription.provider || '-' }}</el-descriptions-item>
        <el-descriptions-item label="当前到期日">{{ formatDate(subscription.current_expiry_date) }}</el-descriptions-item>
        <el-descriptions-item label="到期状态">
          <el-tag :type="getExpiryTagType(subscription)">{{ getExpiryText(subscription) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="续费周期">{{ subscription.renewal_period_value }}{{ unitLabel[subscription.renewal_period_unit] }}</el-descriptions-item>
        <el-descriptions-item label="下次提醒开始日">{{ formatDate(subscription.next_reminder_start_date || undefined) }}</el-descriptions-item>
        <el-descriptions-item label="提前提醒">提前 {{ subscription.remind_days_before }} 天</el-descriptions-item>
        <el-descriptions-item label="提醒方式">{{ subscription.reminder_mode === 'once' ? '只提醒一次' : '每日提醒' }}</el-descriptions-item>
        <el-descriptions-item label="主负责人">{{ subscription.owner_name || subscription.owner?.full_name || subscription.owner?.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="费用">{{ subscription.fee ? `¥${Number(subscription.fee).toFixed(2)}` : '-' }}</el-descriptions-item>
        <el-descriptions-item label="续费方式" :span="2">
          <el-link v-if="isHttpUrl(subscription.renewal_url)" type="primary" :href="subscription.renewal_url || ''" target="_blank">{{ subscription.renewal_url }}</el-link>
          <span v-else>{{ subscription.renewal_url || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ subscription.notes || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="history-card" shadow="never">
      <template #header>续费历史</template>
      <el-table :data="store.renewalLogs" style="width: 100%">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="attachment-panel">
              <div class="attachment-actions">
                <el-upload :auto-upload="false" :show-file-list="false" accept=".pdf,.jpg,.jpeg,.png" :on-change="file => uploadHistoryAttachment(row.id, 'contract', file)">
                  <el-button size="small" type="primary">上传合同</el-button>
                </el-upload>
                <el-upload :auto-upload="false" :show-file-list="false" accept=".pdf,.jpg,.jpeg,.png" :on-change="file => uploadHistoryAttachment(row.id, 'invoice', file)">
                  <el-button size="small" type="primary">上传发票</el-button>
                </el-upload>
              </div>
              <el-table :data="row.attachments || []" size="small" empty-text="暂无附件" style="width: 100%">
                <el-table-column label="类型" width="90">
                  <template #default="{ row: attachment }">
                    <el-tag size="small" :type="attachment.attachment_type === 'contract' ? 'primary' : 'success'">
                      {{ attachment.attachment_type === 'contract' ? '合同' : '发票' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="file_name" label="文件名" min-width="220" show-overflow-tooltip />
                <el-table-column label="大小" width="110">
                  <template #default="{ row: attachment }">{{ formatFileSize(attachment.file_size) }}</template>
                </el-table-column>
                <el-table-column label="上传时间" width="170">
                  <template #default="{ row: attachment }">{{ formatDateTime(attachment.uploaded_at) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="210">
                  <template #default="{ row: attachment }">
                    <el-button size="small" link type="primary" @click="previewAttachment(attachment)">查看</el-button>
                    <el-button size="small" link type="primary" @click="downloadAttachment(attachment)">下载</el-button>
                    <el-button size="small" link type="danger" @click="deleteAttachment(attachment)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="operated_at" label="操作时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.operated_at) }}</template>
        </el-table-column>
        <el-table-column label="续费前到期日" width="140">
          <template #default="{ row }">{{ formatDate(row.previous_expiry_date) }}</template>
        </el-table-column>
        <el-table-column label="续费后到期日" width="140">
          <template #default="{ row }">{{ formatDate(row.new_expiry_date) }}</template>
        </el-table-column>
        <el-table-column label="续费周期" width="120">
          <template #default="{ row }">{{ row.renewal_period_value }}{{ unitLabel[row.renewal_period_unit] }}</template>
        </el-table-column>
        <el-table-column label="附件数" width="90">
          <template #default="{ row }">{{ row.attachments?.length || 0 }}</template>
        </el-table-column>
        <el-table-column label="操作人" width="120">
          <template #default="{ row }">{{ row.operator?.full_name || row.operator?.username || row.operated_by }}</template>
        </el-table-column>
        <el-table-column prop="remarks" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="danger" @click="deleteRenewalLog(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="renewalDialogVisible" title="确认续费" width="560px" destroy-on-close>
      <el-form label-width="110px">
        <el-form-item label="续费备注">
          <el-input v-model="renewalForm.remarks" type="textarea" :rows="3" />
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type UploadFile, type UploadUserFile } from 'element-plus'
import { useSubscriptionStore } from '@/stores/subscription'
import { subscriptionApi } from '@/api/subscription'
import type { SubscriptionRecord, SubscriptionRenewalAttachment } from '@/api/types'

const route = useRoute()
const store = useSubscriptionStore()
const subscriptionId = computed(() => Number(route.params.id))
const subscription = computed(() => store.currentSubscription)
const renewalDialogVisible = ref(false)
const renewing = ref(false)
const contractFiles = ref<UploadUserFile[]>([])
const invoiceFiles = ref<UploadUserFile[]>([])
const renewalForm = reactive({ remarks: '' })
const unitLabel = { day: '天', month: '月', year: '年' }

const loadData = async () => {
  await store.fetchSubscription(subscriptionId.value)
  await store.fetchRenewalLogs(subscriptionId.value)
}

const openRenewDialog = () => {
  renewalForm.remarks = ''
  contractFiles.value = []
  invoiceFiles.value = []
  renewalDialogVisible.value = true
}

const submitRenewal = async () => {
  renewing.value = true
  try {
    const result = await store.renewSubscription(subscriptionId.value, { remarks: renewalForm.remarks })
    const renewalLogId = (result as any)?.renewal_log?.id
    if (renewalLogId) {
      const contractFile = contractFiles.value[0]?.raw
      const invoiceFile = invoiceFiles.value[0]?.raw
      if (contractFile) await store.uploadRenewalAttachment(renewalLogId, 'contract', contractFile)
      if (invoiceFile) await store.uploadRenewalAttachment(renewalLogId, 'invoice', invoiceFile)
    }
    await loadData()
    renewalDialogVisible.value = false
    ElMessage.success('已续费，续约附件已保存')
  } finally {
    renewing.value = false
  }
}

const uploadHistoryAttachment = async (renewalLogId: number, attachmentType: 'contract' | 'invoice', file: UploadFile) => {
  if (!file.raw) return
  await store.uploadRenewalAttachment(renewalLogId, attachmentType, file.raw)
  await store.fetchRenewalLogs(subscriptionId.value)
  ElMessage.success(`${attachmentType === 'contract' ? '合同' : '发票'}附件已保存`)
}

const downloadAttachment = async (attachment: SubscriptionRenewalAttachment) => {
  const blob = await subscriptionApi.downloadRenewalAttachment(attachment.attachment_id)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = attachment.file_name
  link.click()
  URL.revokeObjectURL(url)
}

const deleteRenewalLog = async (row: { id: number; operated_at?: string }) => {
  await ElMessageBox.confirm('确定删除这条续费历史吗？其名下合同/发票附件也会一并删除，但不会自动回滚当前订阅到期日。', '删除续费历史', { type: 'warning' })
  await store.deleteRenewalLog(subscriptionId.value, row.id)
  await store.fetchRenewalLogs(subscriptionId.value)
  ElMessage.success('续费历史已删除')
}

const deleteAttachment = async (attachment: SubscriptionRenewalAttachment) => {
  await ElMessageBox.confirm(`确定删除附件「${attachment.file_name}」吗？`, '删除附件', { type: 'warning' })
  await store.deleteRenewalAttachment(attachment.attachment_id)
  await store.fetchRenewalLogs(subscriptionId.value)
  ElMessage.success('附件已删除')
}

const previewAttachment = async (attachment: SubscriptionRenewalAttachment) => {
  const ext = attachment.file_name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') {
    const res = await subscriptionApi.getRenewalAttachmentPreviewUrl(attachment.attachment_id)
    if (res.data?.preview_url) window.open(res.data.preview_url, '_blank')
    return
  }
  const blob = await subscriptionApi.downloadRenewalAttachment(attachment.attachment_id)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

const formatDate = (value?: string) => value ? String(value).split('T')[0] : '-'
const isHttpUrl = (value?: string | null) => /^https?:\/\//i.test(value || '')
const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString('zh-CN') : '-'
const formatFileSize = (size?: number | null) => {
  if (!size) return '-'
  if (size < 1024) return `${size}B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
  return `${(size / 1024 / 1024).toFixed(1)}MB`
}
const getExpiryTagType = (row: SubscriptionRecord) => row.expiryStatus === 'overdue' ? 'danger' : row.expiryStatus === 'expiring' ? 'warning' : 'success'
const getExpiryText = (row: SubscriptionRecord) => {
  if (row.expiryStatus === 'overdue') return `已逾期 ${Math.abs(row.daysUntilExpiry || 0)} 天`
  if (row.expiryStatus === 'expiring') return `剩余 ${row.daysUntilExpiry} 天`
  return '正常'
}

onMounted(loadData)
</script>

<style scoped>
.page-subtitle { color: #64748b; margin: 4px 0 0; }
.history-card { margin-top: 16px; }
.attachment-panel { padding: 12px 24px; background: #f8fafc; }
.attachment-actions { display: flex; gap: 8px; margin-bottom: 12px; }
</style>
