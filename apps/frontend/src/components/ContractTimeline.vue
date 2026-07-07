<template>
  <div class="contract-timeline" :class="{ compact }">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="timeline-node"
      :class="{ current: item.isCurrent }"
      @click="handleView(item.id)"
    >
      <div class="node-marker">
        <span class="marker-dot">{{ index + 1 }}</span>
        <span v-if="index < items.length - 1" class="marker-line" />
      </div>
      <div class="node-body">
        <div class="node-topline">
          <span class="contract-number">{{ item.contract_number }}</span>
          <el-tag size="small" :type="getStatusType(item.status)">
            {{ getStatusText(item.status) }}
          </el-tag>
        </div>
        <div class="contract-title">{{ item.title }}</div>
        <div class="contract-meta">
          <span>¥{{ formatCurrency(item.total_amount) }}</span>
          <span>{{ formatDate(item.start_date) }} 至 {{ formatDate(item.end_date) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ContractTimelineItem } from '@/api/types'

defineProps<{
  items: ContractTimelineItem[]
  compact?: boolean
}>()

const emit = defineEmits<{
  view: [id: number]
}>()

const handleView = (id: number) => {
  emit('view', id)
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN').format(Number(amount || 0))
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: 'info',
    active: 'success',
    completed: 'primary',
    cancelled: 'danger',
    expired_non_renewed: 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    active: '执行中',
    completed: '已完成',
    cancelled: '已取消',
    expired_non_renewed: '已到期-不续签'
  }
  return statusMap[status] || status
}
</script>

<style scoped>
.contract-timeline {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(220px, 1fr);
  gap: 12px;
  overflow-x: auto;
  padding: 4px 2px 8px;
}

.timeline-node {
  display: grid;
  grid-template-rows: 34px minmax(0, 1fr);
  min-width: 0;
  cursor: pointer;
}

.node-marker {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
}

.marker-dot {
  position: relative;
  z-index: 1;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f4f6f8;
  border: 1px solid #cfd7e2;
  color: #606266;
  font-size: 12px;
  font-weight: 600;
}

.marker-line {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(100% + 12px);
  height: 2px;
  background: #dcdfe6;
  transform: translateY(-50%);
}

.node-body {
  position: relative;
  z-index: 1;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.timeline-node:hover .node-body {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.12);
}

.timeline-node.current .marker-dot {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

.timeline-node.current .node-body {
  border-color: #409eff;
  background: #ecf5ff;
}

.node-topline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.contract-number {
  font-weight: 700;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contract-title {
  margin-top: 6px;
  color: #303133;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.contract-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
}

.compact {
  grid-auto-columns: minmax(180px, 1fr);
}

.compact .node-body {
  padding: 8px 10px;
}

@media (max-width: 767px) {
  .contract-timeline {
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-x: visible;
  }

  .timeline-node {
    grid-template-columns: 30px minmax(0, 1fr);
    grid-template-rows: auto;
  }

  .node-marker {
    align-items: flex-start;
    padding-top: 8px;
  }

  .marker-line {
    left: 50%;
    top: 30px;
    width: 2px;
    height: calc(100% + 10px);
    transform: translateX(-50%);
  }
}
</style>
