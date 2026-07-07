<template>
  <section class="relation-panel">
    <div class="relation-header">
      <div>
        <h3>续签关系</h3>
        <p>{{ relationText }}</p>
      </div>
      <el-tag v-if="timeline?.hasBrokenLink || timeline?.hasCycle" type="warning">
        关系需检查
      </el-tag>
    </div>

    <el-alert
      v-if="timeline?.hasBrokenLink || timeline?.hasCycle"
      class="relation-alert"
      type="warning"
      show-icon
      :closable="false"
      title="部分续签关系不完整，请检查合同关联关系"
    />

    <ContractTimeline
      v-if="timeline && timeline.items.length > 1"
      :items="timeline.items"
      compact
      @view="handleView"
    />

    <el-empty
      v-else
      description="该合同为一次性合同，暂无续签关系"
      :image-size="90"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ContractTimeline as ContractTimelineType } from '@/api/types'
import ContractTimeline from '@/components/ContractTimeline.vue'

const props = defineProps<{
  timeline?: ContractTimelineType
}>()

const emit = defineEmits<{
  view: [id: number]
}>()

const currentItem = computed(() => {
  return props.timeline?.items.find(item => item.isCurrent)
})

const nextItem = computed(() => {
  if (!props.timeline || !currentItem.value) return undefined
  const index = props.timeline.items.findIndex(item => item.id === currentItem.value?.id)
  return index >= 0 ? props.timeline.items[index + 1] : undefined
})

const relationText = computed(() => {
  if (!props.timeline || props.timeline.items.length <= 1) {
    return '该合同为一次性合同，暂无续签关系'
  }
  if (nextItem.value) {
    return `已续签至 ${nextItem.value.contract_number}`
  }
  return '当前为最新合同'
})

const handleView = (id: number) => {
  if (id !== currentItem.value?.id) {
    emit('view', id)
  }
}
</script>

<style scoped>
.relation-panel {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
}

.relation-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.relation-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.relation-header p {
  margin: 6px 0 0;
  color: #606266;
  font-size: 13px;
}

.relation-alert {
  margin-bottom: 12px;
}

@media (max-width: 767px) {
  .relation-header {
    flex-direction: column;
  }
}
</style>
