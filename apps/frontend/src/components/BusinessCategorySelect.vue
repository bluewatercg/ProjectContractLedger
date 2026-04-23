<template>
  <el-tree-select
    v-model="selectedValue"
    :data="categories"
    :props="{ label: 'name', value: 'id', children: 'children' }"
    :placeholder="placeholder"
    :style="{ width: width }"
    clearable
    filterable
    :loading="loading"
    check-strictly
    :render-after-expand="false"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { businessCategoryApi } from '@/api'
import type { BusinessCategory } from '@/api/types'

interface Props {
  modelValue?: number | null
  placeholder?: string
  width?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择业务分类',
  width: '100%',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [value: number | null, category: BusinessCategory | null]
}>()

const selectedValue = ref<number | null>(props.modelValue || null)
const categories = ref<BusinessCategory[]>([])
const loading = ref(false)

watch(() => props.modelValue, (newValue) => {
  selectedValue.value = newValue || null
})

watch(selectedValue, (newValue) => {
  emit('update:modelValue', newValue)
})

const handleChange = (value: number | null) => {
  const category = findCategoryById(categories.value, value)
  emit('change', value, category)
}

const findCategoryById = (list: BusinessCategory[], id: number | null): BusinessCategory | null => {
  if (!id) return null
  for (const cat of list) {
    if (cat.id === id) return cat
    if (cat.children) {
      const found = findCategoryById(cat.children, id)
      if (found) return found
    }
  }
  return null
}

const fetchCategories = async () => {
  try {
    loading.value = true
    const response = await businessCategoryApi.getTree('active')
    if (response.success && response.data) {
      categories.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch business categories:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCategories()
})
</script>
