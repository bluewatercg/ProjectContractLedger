<template>
  <div class="page-container">
    <div class="contract-form-container animate-fade-in">
      <div class="form-header">
        <h2 class="form-title">{{ isEdit ? '编辑合同' : '新建合同' }}</h2>
        <p class="form-description">
          {{ isEdit ? '修改合同信息，确保所有必填项准确无误' : '按向导分三步完成合同录入' }}
        </p>
      </div>

      <!-- 三步向导（仅新建模式） -->
      <el-steps
        v-if="!isEdit"
        :active="step"
        finish-status="success"
        align-center
        class="wizard-steps"
      >
        <el-step title="合同用途" description="选择本合同的业务用途" />
        <el-step title="填写信息" description="按用途录入合同要素" />
        <el-step title="确认提交" description="核对无误后保存" />
      </el-steps>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="140px"
        v-loading="loading"
      >
        <!-- Step 1: 合同用途 -->
        <div v-if="!isEdit && step === 0" class="form-section">
          <h3 class="section-title">
            <el-icon><Document /></el-icon>
            合同用途
          </h3>
          <el-radio-group v-model="form.contract_type" class="purpose-group">
            <el-radio-button label="main">
              主合同
              <div class="purpose-desc">与客户的主体合作合同（如项目开发、整体服务）</div>
            </el-radio-button>
            <el-radio-button label="maintenance">
              运维合同
              <div class="purpose-desc">依附于主合同的运维/服务合同</div>
            </el-radio-button>
            <el-radio-button label="supplement">
              补充协议
              <div class="purpose-desc">对主合同条款的补充或变更</div>
            </el-radio-button>
            <el-radio-button label="renewal">
              续签合同
              <div class="purpose-desc">对同一客户同一业务的到期续签，需选择被续签的旧合同</div>
            </el-radio-button>
            <el-radio-button label="standalone">
              独立合同
              <div class="purpose-desc">不依赖其他合同的独立项目</div>
            </el-radio-button>
          </el-radio-group>
          <div class="step-actions">
            <el-button @click="goBack">取消</el-button>
            <el-button type="primary" @click="nextStep">下一步</el-button>
          </div>
        </div>

        <!-- Edit 模式或 Step 2: 填写信息 -->
        <template v-if="isEdit || step === 1">
          <div class="form-section">
            <h3 class="section-title">
              <el-icon><Document /></el-icon>
              基本信息
            </h3>
            <div class="form-grid">
              <el-form-item label="客户" prop="customer_id" class="form-item-full">
                <CustomerSelect
                  v-model="form.customer_id"
                  placeholder="请选择客户（支持搜索）"
                  @change="handleCustomerChange"
                />
              </el-form-item>

              <el-form-item label="业务分类" prop="business_category_id" class="form-item-full">
                <BusinessCategorySelect
                  v-model="form.business_category_id"
                  placeholder="请选择业务分类（可选）"
                />
              </el-form-item>

              <el-form-item label="合同标题" prop="title" class="form-item-full">
                <el-input v-model="form.title" placeholder="请输入合同标题" />
              </el-form-item>

              <el-form-item label="合同描述" prop="description" class="form-item-full">
                <el-input
                  v-model="form.description"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入合同描述"
                />
              </el-form-item>
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-title">
              <el-icon><Money /></el-icon>
              金额与日期
            </h3>
            <div class="form-grid">
              <el-form-item label="合同金额" prop="total_amount">
                <el-input-number
                  v-model="form.total_amount"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  placeholder="请输入合同金额"
                >
                  <template #prefix>
                    <span class="currency-symbol">¥</span>
                  </template>
                </el-input-number>
              </el-form-item>

              <el-form-item label="开始日期" prop="start_date">
                <el-date-picker
                  v-model="form.start_date"
                  type="date"
                  placeholder="请选择开始日期"
                  style="width: 100%"
                />
              </el-form-item>

              <el-form-item label="结束日期" prop="end_date">
                <el-date-picker
                  v-model="form.end_date"
                  type="date"
                  placeholder="请选择结束日期"
                  style="width: 100%"
                />
              </el-form-item>
            </div>
          </div>

          <!-- 续签来源（仅续签类型显示） -->
          <div
            v-if="form.contract_type === 'renewal'"
            class="form-section"
          >
            <h3 class="section-title">
              <el-icon><Link /></el-icon>
              续签来源
            </h3>
            <div class="form-grid">
              <el-form-item
                label="被续签的旧合同"
                prop="previous_contract_id"
                :rules="[{ required: true, message: '请选择需要续签的旧合同', trigger: 'change' }]"
                class="form-item-full"
              >
                <el-select
                  v-model="previousContractId"
                  filterable
                  clearable
                  placeholder="请选择同一客户下已到期或已完成的旧合同"
                  style="width: 100%"
                  :loading="oldContractsLoading"
                >
                  <el-option
                    v-for="c in oldContracts"
                    :key="c.id"
                    :label="`${c.contract_number} - ${c.title}`"
                    :value="c.id"
                  />
                </el-select>
                <div class="form-tip">
                  <el-icon><InfoFilled /></el-icon>
                  续签合同将继承旧合同的客户与业务脉络，便于追溯合同历史
                </div>
              </el-form-item>
            </div>
          </div>

          <!-- 续签配置（仅续签类型或主合同显示） -->
          <div
            v-if="form.contract_type === 'renewal' || form.contract_type === 'main' || form.contract_type === 'standalone' || isEdit"
            class="form-section"
          >
            <h3 class="section-title">
              <el-icon><Refresh /></el-icon>
              续签配置
            </h3>
            <div class="form-grid">
              <el-form-item label="是否续签" prop="is_renewable" class="form-item-full">
                <el-radio-group v-model="form.is_renewable">
                  <el-radio :label="false">否，一次性合同（如开发项目、咨询服务等）</el-radio>
                  <el-radio :label="true">是，需要续签（如运维服务、年度支持等）</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item
                v-if="form.is_renewable"
                label="续签提醒"
                prop="renewal_reminder_days"
                class="form-item-full"
              >
                <el-select
                  v-model="form.renewal_reminder_days"
                  placeholder="请选择提醒时间"
                  style="width: 100%"
                >
                  <el-option label="提前5天提醒（紧急项目）" value="5" />
                  <el-option label="提前30天提醒（常规服务）" value="30" />
                  <el-option label="提前60天提醒（重要客户）" value="60" />
                </el-select>
                <div class="form-tip">
                  <el-icon><InfoFilled /></el-icon>
                  系统将在合同到期前按选定天数发送续签提醒
                </div>
              </el-form-item>

              <!-- 编辑模式下保留旧合同关联入口 -->
              <el-form-item v-if="isEdit" label="关联旧合同" class="form-item-full">
                <el-select
                  v-model="previousContractId"
                  filterable
                  clearable
                  placeholder="可选：关联已到期或已完成的旧合同"
                  style="width: 100%"
                  :loading="oldContractsLoading"
                >
                  <el-option
                    v-for="c in oldContracts"
                    :key="c.id"
                    :label="`${c.contract_number} - ${c.title}`"
                    :value="c.id"
                  />
                </el-select>
                <div class="form-tip">
                  <el-icon><InfoFilled /></el-icon>
                  关联旧合同后可追溯合同历史，支持选择本公司未被关联的其他合同
                </div>
              </el-form-item>
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-title">
              <el-icon><Memo /></el-icon>
              合同条款与备注
            </h3>
            <div class="form-grid">
              <el-form-item label="合同条款" prop="terms" class="form-item-full">
                <el-input
                  v-model="form.terms"
                  type="textarea"
                  :rows="6"
                  placeholder="请输入合同条款"
                />
              </el-form-item>

              <el-form-item label="备注" prop="notes" class="form-item-full">
                <el-input
                  v-model="form.notes"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入备注信息"
                />
              </el-form-item>
            </div>
          </div>

          <div class="step-actions">
            <el-button @click="goBack">取消</el-button>
            <el-button v-if="!isEdit" @click="prevStep">上一步</el-button>
            <el-button v-if="!isEdit" type="primary" @click="nextStep">下一步</el-button>
            <el-button v-else type="primary" :loading="submitting" @click="handleSubmit">
              {{ submitting ? '保存中...' : '保存' }}
            </el-button>
          </div>
        </template>

        <!-- Step 3: 确认提交 -->
        <div v-if="!isEdit && step === 2" class="form-section">
          <h3 class="section-title">
            <el-icon><Memo /></el-icon>
            确认合同信息
          </h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="合同用途">{{ contractTypeText }}</el-descriptions-item>
            <el-descriptions-item label="客户">{{ customerDisplayName }}</el-descriptions-item>
            <el-descriptions-item label="业务分类">{{ businessCategoryName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="合同标题">{{ form.title || '-' }}</el-descriptions-item>
            <el-descriptions-item label="合同金额">¥{{ formatCurrency(safeNumber(form.total_amount)) }}</el-descriptions-item>
            <el-descriptions-item label="合同期限">
              {{ formatDisplayDate(form.start_date as any) }} ~ {{ formatDisplayDate(form.end_date as any) }}
            </el-descriptions-item>
            <el-descriptions-item v-if="form.contract_type === 'renewal'" label="被续签旧合同">
              {{ renewalOldContractTitle }}
            </el-descriptions-item>
            <el-descriptions-item label="是否续签">{{ form.is_renewable ? '是' : '否' }}</el-descriptions-item>
            <el-descriptions-item v-if="form.is_renewable" label="续签提醒">
              提前 {{ form.renewal_reminder_days || '30' }} 天
            </el-descriptions-item>
            <el-descriptions-item v-if="form.description" label="合同描述" :span="2">{{ form.description }}</el-descriptions-item>
            <el-descriptions-item v-if="form.terms" label="合同条款" :span="2">{{ form.terms }}</el-descriptions-item>
            <el-descriptions-item v-if="form.notes" label="备注" :span="2">{{ form.notes }}</el-descriptions-item>
          </el-descriptions>
          <div class="step-actions">
            <el-button @click="goBack">取消</el-button>
            <el-button @click="prevStep">上一步</el-button>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">
              {{ submitting ? '保存中...' : '确认并保存' }}
            </el-button>
          </div>
        </div>
      </el-form>

      <!-- 编辑模式下显示发票和收款信息 -->
      <div v-if="isEdit && contractData && contractData.invoices && contractData.invoices.length > 0" class="mt-8">
        <el-divider content-position="left">
          <h3 class="text-lg font-semibold">关联发票及收款情况</h3>
        </el-divider>

        <div class="stats-container">
          <div class="stat-card stat-card-blue">
            <div class="stat-label">发票总数</div>
            <div class="stat-value">{{ invoiceStats.totalCount }}</div>
          </div>
          <div class="stat-card stat-card-green">
            <div class="stat-label">发票总额</div>
            <div class="stat-value">¥{{ formatCurrency(invoiceStats.totalAmount) }}</div>
          </div>
          <div class="stat-card stat-card-purple">
            <div class="stat-label">未开票总额</div>
            <div class="stat-value">¥{{ formatCurrency(invoiceStats.uninvoicedAmount) }}</div>
          </div>
          <div class="stat-card stat-card-orange">
            <div class="stat-label">已收款</div>
            <div class="stat-value">¥{{ formatCurrency(invoiceStats.paidAmount) }}</div>
          </div>
          <div class="stat-card stat-card-red">
            <div class="stat-label">未收款</div>
            <div class="stat-value">¥{{ formatCurrency(invoiceStats.unpaidAmount) }}</div>
          </div>
        </div>

        <el-table :data="contractData?.invoices || []" border style="width: 100%">
          <el-table-column prop="invoice_number" label="发票编号" width="150">
            <template #default="scope">
              <el-link
                type="primary"
                @click="goToViewInvoice(scope.row.id)"
                :underline="false"
                class="invoice-link"
              >
                {{ scope.row.invoice_number }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="发票金额" width="120">
            <template #default="scope">
              ¥{{ formatCurrency(scope.row.total_amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="issue_date" label="开票日期" width="120">
            <template #default="scope">
              {{ formatDisplayDate(scope.row.issue_date) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="发票状态" width="100">
            <template #default="scope">
              <el-tag :type="getInvoiceStatusType(scope.row.status)">
                {{ getInvoiceStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="收款情况" min-width="300">
            <template #default="scope">
              <div v-if="scope.row.payments && scope.row.payments.length > 0">
                <div v-for="payment in scope.row.payments" :key="payment.id" class="payment-item">
                  <div class="payment-header">
                    <div class="payment-amount">
                      <span class="amount-text">¥{{ formatCurrency(payment.amount) }}</span>
                      <span class="date-text">{{ formatDisplayDate(payment.payment_date) }}</span>
                    </div>
                    <div class="payment-tags">
                      <el-tag size="small" :type="getPaymentStatusType(payment.status)">
                        {{ getPaymentStatusText(payment.status) }}
                      </el-tag>
                      <el-tag size="small" type="info">
                        {{ getPaymentMethodText(payment.payment_method) }}
                      </el-tag>
                    </div>
                  </div>
                  <div v-if="payment.reference_number" class="reference-number">
                    参考号: {{ payment.reference_number }}
                  </div>
                </div>
                <div class="payment-summary">
                  已收: ¥{{ formatCurrency(getInvoicePaidAmount(scope.row)) }} /
                  未收: ¥{{ formatCurrency(scope.row.total_amount - getInvoicePaidAmount(scope.row)) }}
                </div>
              </div>
              <div v-else class="text-gray-500 text-sm">暂无收款记录</div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else-if="isEdit && contractData && (!contractData.invoices || contractData.invoices.length === 0)" class="mt-8">
        <el-divider content-position="left">
          <h3 class="text-lg font-semibold">关联发票及收款情况</h3>
        </el-divider>
        <div class="text-center py-8 text-gray-500">
          <p>该合同暂无关联发票</p>
        </div>
      </div>

      <div v-if="isEdit && contractData" class="mt-8">
        <el-divider content-position="left">
          <h3 class="text-lg font-semibold">合同附件</h3>
        </el-divider>

        <div class="mb-4">
          <FileUpload
            :upload-url="`/contracts/${contractId}/attachments`"
            @success="handleAttachmentUpload"
            @error="handleUploadError"
          />
        </div>

        <AttachmentList
          :attachments="attachments"
          :loading="attachmentsLoading"
          attachment-type="contract"
          @delete="handleDeleteAttachment"
          @refresh="fetchAttachments"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { InfoFilled, Document, Money, Refresh, Memo, Link } from '@element-plus/icons-vue'
import { contractApi } from '@/api'
import { attachmentApi } from '@/api/attachment'
import { useKitStore } from '@/stores/kit'
import type { CreateContractDto, UpdateContractDto, Customer, Contract } from '@/api/types'
import type { Attachment } from '@/api/attachment'
import CustomerSelect from '@/components/CustomerSelect.vue'
import FileUpload from '@/components/FileUpload.vue'
import AttachmentList from '@/components/AttachmentList.vue'
import BusinessCategorySelect from '@/components/BusinessCategorySelect.vue'
const router = useRouter()
const route = useRoute()
const kitStore = useKitStore()

const formRef = ref<FormInstance>()

const loading = ref(false)
const submitting = ref(false)
const contractData = ref<any>(null)
const attachments = ref<Attachment[]>([])
const attachmentsLoading = ref(false)

const step = ref(0)

const previousContractId = ref<number | null>(null)
const oldContracts = ref<Array<{ id: number; contract_number: string; title: string }>>([])
const oldContractsLoading = ref(false)

const selectedCustomer = ref<Customer | null>(null)

const isEdit = computed(() => !!route.params.id)
const contractId = computed(() => Number(route.params.id))

const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

const invoiceStats = computed(() => {
  if (!contractData.value?.invoices || !Array.isArray(contractData.value.invoices)) {
    return {
      totalCount: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      uninvoicedAmount: contractData.value ? safeNumber(contractData.value.total_amount) : 0
    }
  }
  const invoices = contractData.value.invoices
  const contractAmount = safeNumber(contractData.value.total_amount)
  const totalCount = invoices.length
  const totalAmount = invoices.reduce((sum: number, invoice: any) => sum + safeNumber(invoice.total_amount), 0)
  const paidAmount = invoices.reduce((sum: number, invoice: any) => sum + getInvoicePaidAmount(invoice), 0)
  const unpaidAmount = totalAmount - paidAmount
  const uninvoicedAmount = contractAmount - totalAmount
  return { totalCount, totalAmount, paidAmount, unpaidAmount, uninvoicedAmount }
})

const form = reactive<CreateContractDto>({
  customer_id: 0,
  title: '',
  description: '',
  total_amount: 0,
  start_date: '',
  end_date: '',
  is_renewable: false,
  renewal_reminder_days: '30',
  terms: '',
  notes: '',
  business_category_id: undefined,
  contract_type: 'main',
})

const rules: FormRules = {
  customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }],
  title: [{ required: true, message: '请输入合同标题', trigger: 'blur' }],
  total_amount: [{ required: true, message: '请输入合同金额', trigger: 'blur' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
}

const contractTypeText = computed(() => {
  const map: Record<string, string> = {
    main: '主合同',
    maintenance: '运维合同',
    supplement: '补充协议',
    renewal: '续签合同',
    standalone: '独立合同',
  }
  return map[form.contract_type || 'main'] || '主合同'
})

const renewalOldContractTitle = computed(() => {
  const found = oldContracts.value.find(c => c.id === previousContractId.value)
  return found ? `${found.contract_number} - ${found.title}` : '-'
})

const customerDisplayName = computed(() => {
  if (selectedCustomer.value?.name) return selectedCustomer.value.name
  if (contractData.value?.customer?.name) return contractData.value.customer.name
  return form.customer_id ? `客户 #${form.customer_id}` : '-'
})

const businessCategoryName = computed(() => {
  return contractData.value?.businessCategory?.name || (form.business_category_id ? `分类 #${form.business_category_id}` : '')
})

const handleCustomerChange = (_customerId: number | null, customer: Customer | null) => {
  form.customer_id = _customerId || 0
  selectedCustomer.value = customer
  previousContractId.value = null
  oldContracts.value = []
  if (_customerId) {
    fetchOldContracts()
  }
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('zh-CN').format(amount)

const formatDisplayDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getInvoiceStatusType = (status: string) => {
  const map: Record<string, string> = { draft: 'info', sent: 'warning', paid: 'success', overdue: 'danger', cancelled: 'primary' }
  return map[status] || 'info'
}

const getInvoiceStatusText = (status: string) => {
  const map: Record<string, string> = { draft: '草稿', sent: '已开票', paid: '已付款', overdue: '逾期', cancelled: '已取消' }
  return map[status] || status
}

const getPaymentStatusType = (status: string) => {
  const map: Record<string, string> = { pending: 'warning', completed: 'success', failed: 'danger' }
  return map[status] || 'info'
}

const getPaymentStatusText = (status: string) => {
  const map: Record<string, string> = { pending: '待处理', completed: '已完成', failed: '失败' }
  return map[status] || status
}

const getPaymentMethodText = (method: string) => {
  const map: Record<string, string> = { cash: '现金', bank_transfer: '银行转账', check: '支票', credit_card: '信用卡', other: '其他' }
  return map[method] || method
}

const getInvoicePaidAmount = (invoice: any) => {
  if (!invoice.payments || !Array.isArray(invoice.payments) || invoice.payments.length === 0) return 0
  return invoice.payments
    .filter((p: any) => p.status === 'completed')
    .reduce((sum: number, p: any) => sum + safeNumber(p.amount), 0)
}

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null
  return date
}

const formatDate = (date: Date | string | null): string => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fetchContract = async () => {
  if (!isEdit.value) return
  try {
    loading.value = true
    const response = await contractApi.getContractById(contractId.value, {
      viewAll: kitStore.viewAllKits,
    })
    if (response.success && response.data) {
      const contract = response.data
      contractData.value = contract
      selectedCustomer.value = contract.customer || null
      Object.assign(form, {
        ...contract,
        start_date: parseDate(contract.start_date),
        end_date: parseDate(contract.end_date),
        is_renewable: contract.is_renewable || false,
        renewal_reminder_days: contract.renewal_reminder_days || '30',
        contract_type: contract.contract_type || 'main',
      })
      if (contract.previous_contract_id) {
        previousContractId.value = contract.previous_contract_id
      }
    }
  } catch (error) {
    console.error('Failed to fetch contract:', error)
    ElMessage.error('获取合同信息失败')
  } finally {
    loading.value = false
  }
}

const fetchOldContracts = async () => {
  if (!form.customer_id) {
    oldContracts.value = []
    return
  }
  try {
    oldContractsLoading.value = true
    const response = await contractApi.getPreviousContractOptions({
      customerId: form.customer_id,
      currentContractId: isEdit.value ? contractId.value : undefined,
      viewAll: kitStore.viewAllKits,
    })
    if (response.success && response.data) {
      oldContracts.value = (response.data as Contract[]).map((c) => ({
        id: c.id,
        contract_number: c.contract_number,
        title: c.title,
      }))
    }
  } catch (error) {
    console.error('Failed to fetch old contracts:', error)
  } finally {
    oldContractsLoading.value = false
  }
}

watch(
  () => form.contract_type,
  (type) => {
    if (type !== 'renewal') {
      if (!isEdit.value) previousContractId.value = null
    }
  }
)

const validateStep = async (s: number): Promise<boolean> => {
  if (!formRef.value) return true
  if (s === 0) {
    if (!form.contract_type) {
      ElMessage.warning('请选择合同用途')
      return false
    }
    return true
  }
  try {
    await formRef.value.validate()
    return true
  } catch {
    return false
  }
}

const nextStep = async () => {
  const ok = await validateStep(step.value)
  if (!ok) return
  step.value++
}

const prevStep = () => {
  if (step.value > 0) step.value--
}

const handleSubmit = async () => {
  if (!isEdit.value && step.value < 2) {
    const ok = await validateStep(step.value)
    if (!ok) return
    step.value++
    return
  }
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  try {
    submitting.value = true
    const submitData: any = {
      ...form,
      start_date: formatDate(form.start_date),
      end_date: formatDate(form.end_date),
    }
    submitData.previous_contract_id = previousContractId.value || null

    let response
    if (isEdit.value) {
      response = await contractApi.updateContract(
        contractId.value,
        submitData as UpdateContractDto,
        { viewAll: kitStore.viewAllKits }
      )
    } else {
      response = await contractApi.createContract(submitData)
    }

    if (response.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      router.push('/contracts')
    } else {
      ElMessage.error(response.message || '保存失败，输入已保留，请修改后重试')
    }
  } catch (error: any) {
    console.error('Failed to submit form:', error)
    ElMessage.error(error?.message || '保存失败，输入已保留，请修改后重试')
  } finally {
    submitting.value = false
  }
}

const goToViewInvoice = (invoiceId: number) => router.push(`/invoices/${invoiceId}`)
const goBack = () => router.go(-1)

const fetchAttachments = async () => {
  if (!isEdit.value) return
  try {
    attachmentsLoading.value = true
    const response = await attachmentApi.getContractAttachments(contractId.value)
    if (response.success && response.data) attachments.value = response.data
  } catch (error) {
    console.error('Failed to fetch attachments:', error)
    ElMessage.error('获取附件列表失败')
  } finally {
    attachmentsLoading.value = false
  }
}

const handleAttachmentUpload = (attachment: Attachment) => {
  attachments.value.unshift(attachment)
  ElMessage.success('附件上传成功')
}

const handleUploadError = (error: any) => {
  console.error('Upload error:', error)
  ElMessage.error('附件上传失败')
}

const handleDeleteAttachment = async (attachmentId: number) => {
  try {
    const response = await attachmentApi.deleteContractAttachment(contractId.value, attachmentId)
    if (response.success) {
      attachments.value = attachments.value.filter(item => item.attachment_id !== attachmentId)
      ElMessage.success('附件删除成功')
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    console.error('Delete error:', error)
    ElMessage.error('删除附件失败')
  }
}

onMounted(async () => {
  if (isEdit.value) {
    await fetchContract()
    await fetchOldContracts()
    await fetchAttachments()
  } else if (form.customer_id) {
    await fetchOldContracts()
  }
})
</script>

<style scoped>
/* 表单容器 */
.contract-form-container {
  max-width: 1100px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  padding: 28px 32px 36px;
}

.form-header {
  margin-bottom: 24px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 16px;
}

.form-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.form-description {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.wizard-steps {
  margin-bottom: 28px;
}

.form-section {
  margin-bottom: 28px;
  padding: 20px 24px;
  background: #fafafa;
  border-radius: 6px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 18px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0 24px;
}

.form-item-full {
  grid-column: 1 / -1;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.currency-symbol {
  color: #909399;
  font-size: 14px;
}

.purpose-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.purpose-group .el-radio-button {
  width: 100%;
}

.purpose-group :deep(.el-radio-button__inner) {
  width: 100%;
  text-align: left;
  border-radius: 6px !important;
  border: 1px solid #dcdfe6 !important;
  box-shadow: none !important;
  padding: 14px 18px;
}

.purpose-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: #ecf5ff;
  border-color: #409eff !important;
  color: #409eff;
}

.purpose-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  font-weight: normal;
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  padding: 16px;
  border-radius: 6px;
  text-align: center;
  color: #fff;
}

.stat-card-blue { background: #409eff; }
.stat-card-green { background: #67c23a; }
.stat-card-purple { background: #9b59b6; }
.stat-card-orange { background: #e6a23c; }
.stat-card-red { background: #f56c6c; }

.stat-label {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
}

.payment-item {
  padding: 8px 0;
  border-bottom: 1px dashed #ebeef5;
}

.payment-item:last-child {
  border-bottom: none;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-amount {
  display: flex;
  align-items: center;
  gap: 12px;
}

.amount-text {
  font-weight: 600;
  color: #303133;
}

.date-text {
  font-size: 12px;
  color: #909399;
}

.payment-tags {
  display: flex;
  gap: 6px;
}

.reference-number {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.payment-summary {
  font-size: 12px;
  color: #606266;
  margin-top: 6px;
}

.invoice-link {
  font-weight: 500;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.mt-8 { margin-top: 32px; }
.mb-4 { margin-bottom: 16px; }
.py-8 { padding-top: 32px; padding-bottom: 32px; }
.text-center { text-align: center; }
.text-lg { font-size: 18px; }
.text-sm { font-size: 13px; }
.font-semibold { font-weight: 600; }
.text-gray-500 { color: #909399; }
</style>
