<template>
  <div class="report-table">
    <el-card shadow="never">
      <template #header>
        <span class="table-title">{{ title }}</span>
      </template>

      <el-table
        :data="data"
        :loading="loading"
        stripe
        border
        :show-summary="showSummary"
        :summary-method="getSummaries"
        style="width: 100%"
      >
        <el-table-column
          v-for="column in columns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :align="column.align || 'left'"
          :sortable="column.sortable"
          :formatter="column.formatter"
        >
          <template v-if="column.slot" #default="scope">
            <slot :name="column.slot" :row="scope.row" :column="column" />
          </template>
        </el-table-column>

        <el-table-column
          v-if="showActions"
          label="操作"
          width="120"
          align="center"
          fixed="right"
        >
          <template #default="scope">
            <slot name="actions" :row="scope.row" />
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && (!data || data.length === 0)" description="暂无数据" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TableColumnCtx } from 'element-plus'

// Props
interface Column {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  formatter?: (row: any, column: TableColumnCtx<any>, cellValue: any, index: number) => string
  slot?: string
}

interface Props {
  title?: string
  data: any[]
  columns: Column[]
  loading?: boolean
  showSummary?: boolean
  summaryMethod?: (param: { columns: TableColumnCtx<any>[]; data: any[] }) => string[]
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '数据表格',
  loading: false,
  showSummary: false,
  showActions: false
})

// Methods
const getSummaries = (param: { columns: TableColumnCtx<any>[]; data: any[] }) => {
  if (props.summaryMethod) {
    return props.summaryMethod(param)
  }

  const { columns, data } = param
  const sums: string[] = []

  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }

    const values = data.map(item => Number(item[column.property]))
    if (!values.every(value => Number.isNaN(value))) {
      const sum = values.reduce((prev, curr) => {
        const value = Number(curr)
        if (!Number.isNaN(value)) {
          return prev + curr
        } else {
          return prev
        }
      }, 0)
      sums[index] = sum.toFixed(2)
    } else {
      sums[index] = '-'
    }
  })

  return sums
}
</script>

<style scoped>
.report-table {
  margin-bottom: 20px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

:deep(.el-table__footer-wrapper) {
  font-weight: 600;
}
</style>
