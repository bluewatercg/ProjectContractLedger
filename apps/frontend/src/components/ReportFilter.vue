<template>
  <div class="report-filter">
    <el-card shadow="never">
      <div class="filter-row">
        <!-- 日期范围选择 -->
        <div class="filter-item">
          <label>日期范围</label>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </div>

        <!-- 时间维度选择 -->
        <div class="filter-item">
          <label>时间维度</label>
          <el-select
            v-model="groupByValue"
            placeholder="选择时间维度"
            @change="handleGroupByChange"
          >
            <el-option label="按日" value="day" />
            <el-option label="按月" value="month" />
            <el-option label="按季度" value="quarter" />
            <el-option label="按年" value="year" />
          </el-select>
        </div>

        <!-- 快捷时间按钮 -->
        <div class="filter-item">
          <label>快捷选择</label>
          <el-button-group>
            <el-button size="small" @click="handleQuickSelect('thisMonth')">
              本月
            </el-button>
            <el-button size="small" @click="handleQuickSelect('thisQuarter')">
              本季度
            </el-button>
            <el-button size="small" @click="handleQuickSelect('thisYear')">
              本年
            </el-button>
            <el-button size="small" @click="handleQuickSelect('lastYear')">
              去年
            </el-button>
          </el-button-group>
        </div>

        <!-- 操作按钮 -->
        <div class="filter-item filter-actions">
          <el-button type="primary" :icon="Search" @click="handleQuery">
            查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>

          <!-- 导出下拉菜单 -->
          <el-dropdown @command="handleExport">
            <el-button :icon="Download">
              导出<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="excel">导出为 Excel</el-dropdown-item>
                <el-dropdown-item command="pdf">导出为 PDF</el-dropdown-item>
                <el-dropdown-item command="csv">导出为 CSV</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 打印按钮 -->
          <el-button :icon="Printer" @click="handlePrint">打印</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search, Refresh, Download, Printer, ArrowDown } from '@element-plus/icons-vue'

// Props
interface Props {
  startDate?: string
  endDate?: string
  groupBy?: 'day' | 'month' | 'quarter' | 'year'
}

const props = withDefaults(defineProps<Props>(), {
  groupBy: 'month'
})

// Emits
const emit = defineEmits<{
  'query': [params: { startDate?: string; endDate?: string; groupBy: string }]
  'export': [format: 'excel' | 'pdf' | 'csv']
  'print': []
}>()

// State
const dateRange = ref<[string, string] | null>(
  props.startDate && props.endDate ? [props.startDate, props.endDate] : null
)
const groupByValue = ref(props.groupBy)

// Watch props changes
watch(() => [props.startDate, props.endDate], ([start, end]) => {
  if (start && end) {
    dateRange.value = [start, end]
  }
})

watch(() => props.groupBy, (newVal) => {
  groupByValue.value = newVal
})

// Methods
const handleDateChange = () => {
  // Date change will be handled by query button
}

const handleGroupByChange = () => {
  // Group by change will be handled by query button
}

const handleQuickSelect = (type: string) => {
  const now = new Date()
  let startDate: Date
  let endDate: Date = now

  switch (type) {
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      groupByValue.value = 'day'
      break
    case 'thisQuarter':
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0)
      groupByValue.value = 'month'
      break
    case 'thisYear':
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31)
      groupByValue.value = 'month'
      break
    case 'lastYear':
      startDate = new Date(now.getFullYear() - 1, 0, 1)
      endDate = new Date(now.getFullYear() - 1, 11, 31)
      groupByValue.value = 'month'
      break
    default:
      return
  }

  dateRange.value = [
    formatDate(startDate),
    formatDate(endDate)
  ]

  // Auto query after quick select
  handleQuery()
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const handleQuery = () => {
  emit('query', {
    startDate: dateRange.value?.[0],
    endDate: dateRange.value?.[1],
    groupBy: groupByValue.value
  })
}

const handleReset = () => {
  dateRange.value = null
  groupByValue.value = 'month'
  handleQuery()
}

const handleExport = (format: 'excel' | 'pdf' | 'csv') => {
  emit('export', format)
}

const handlePrint = () => {
  emit('print')
}
</script>

<style scoped>
.report-filter {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.filter-actions {
  margin-left: auto;
  flex-direction: row;
  align-items: center;
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-actions {
    margin-left: 0;
    flex-wrap: wrap;
  }
}
</style>
