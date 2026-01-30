<template>
  <el-select
    v-model="selectedValue"
    :placeholder="placeholder"
    :style="{ width: width }"
    :disabled="disabled"
    :clearable="clearable"
    @change="handleChange"
  >
    <el-option
      v-for="kit in kits"
      :key="kit.id"
      :label="kit.name"
      :value="kit.id"
    >
      <div class="kit-option">
        <span class="kit-name">{{ kit.name }}</span>
        <el-tag v-if="kit.id === kitStore.currentKitId" size="small" type="success">当前</el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useKitStore } from '@/stores/kit'
import type { Kit } from '@/api/types'

// Props
interface Props {
  modelValue?: number | null
  placeholder?: string
  width?: string
  disabled?: boolean
  clearable?: boolean
  autoSelectCurrent?: boolean  // 是否自动选择当前 kit
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择套账',
  width: '200px',
  disabled: false,
  clearable: false,
  autoSelectCurrent: true
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [value: number | null, kit: Kit | null]
}>()

const kitStore = useKitStore()

// 状态
const selectedValue = ref<number | null>(props.modelValue || null)
const kits = computed(() => kitStore.kits)

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  selectedValue.value = newValue || null
})

// 监听内部值变化
watch(selectedValue, (newValue) => {
  emit('update:modelValue', newValue)
})

// 处理选择变化
const handleChange = (value: number | null) => {
  const kit = kits.value.find(k => k.id === value) || null
  emit('change', value, kit)
}

// 组件初始化
onMounted(() => {
  // 如果设置了自动选择当前 kit 且没有预设值
  if (props.autoSelectCurrent && !selectedValue.value && kitStore.currentKitId) {
    selectedValue.value = kitStore.currentKitId
    emit('update:modelValue', kitStore.currentKitId)
  }
})
</script>

<style scoped>
.kit-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.kit-name {
  flex: 1;
}
</style>
