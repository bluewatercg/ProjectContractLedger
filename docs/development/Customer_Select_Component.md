# 智能客户选择组件

## 概述

为了解决1000多个客户数据导致的性能问题，我们开发了一个智能的客户选择组件 `CustomerSelect.vue`，支持模糊搜索、分页加载和滚动加载更多功能。

## 功能特性

### 🔍 智能搜索
- **实时搜索**: 输入关键词实时搜索客户
- **模糊匹配**: 支持客户名称、联系人、电话、邮箱的模糊搜索
- **防抖优化**: 300ms 防抖，避免频繁API请求

### 📄 分页加载
- **按需加载**: 每次只加载10个客户
- **滚动加载**: 点击"加载更多"获取下一页数据
- **性能优化**: 避免一次性加载大量数据

### 🎨 用户体验
- **丰富显示**: 显示客户名称、联系人和电话
- **加载状态**: 显示加载动画和状态提示
- **无数据提示**: 搜索无结果时的友好提示
- **清空功能**: 支持清空选择

## 组件API

### Props

```typescript
interface Props {
  modelValue?: number | null    // 选中的客户ID
  placeholder?: string          // 占位符文本
  width?: string               // 组件宽度
  disabled?: boolean           // 是否禁用
}
```

### Events

```typescript
interface Emits {
  'update:modelValue': [value: number | null]           // 值变化
  'change': [value: number | null, customer: Customer | null]  // 选择变化
}
```

### 默认值

```typescript
const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择客户',
  width: '100%',
  disabled: false
})
```

## 使用方法

### 1. 基础使用

```vue
<template>
  <CustomerSelect
    v-model="selectedCustomerId"
    placeholder="请选择客户"
    @change="handleCustomerChange"
  />
</template>

<script setup>
import CustomerSelect from '@/components/CustomerSelect.vue'

const selectedCustomerId = ref(null)

const handleCustomerChange = (customerId, customer) => {
  console.log('选中客户:', customer)
}
</script>
```

### 2. 自定义宽度

```vue
<CustomerSelect
  v-model="customerId"
  width="300px"
  placeholder="选择客户筛选"
/>
```

### 3. 在表单中使用

```vue
<el-form-item label="客户" prop="customer_id">
  <CustomerSelect
    v-model="form.customer_id"
    placeholder="请选择客户（支持搜索）"
    @change="handleCustomerChange"
  />
</el-form-item>
```

## 技术实现

### 1. 搜索防抖

```typescript
const handleSearch = (keyword: string) => {
  searchKeyword.value = keyword
  
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    hasMore.value = true
    searchCustomers(keyword, 1, false)
  }, 300) // 300ms 防抖
}
```

### 2. 分页加载

```typescript
const searchCustomers = async (keyword = '', page = 1, append = false) => {
  const response = await customerApi.getCustomers({
    page,
    limit: pageSize,
    search: keyword.trim(),
    sortBy: 'name',
    sortOrder: 'ASC'
  })

  if (append) {
    customers.value = [...customers.value, ...newCustomers]
  } else {
    customers.value = newCustomers
  }
  
  hasMore.value = page < response.data.totalPages
}
```

### 3. 滚动加载

```typescript
const loadMore = async () => {
  if (hasMore.value && !loadingMore.value) {
    await searchCustomers(searchKeyword.value, currentPage.value + 1, true)
  }
}
```

## 性能优化

### 1. 请求优化
- **防抖机制**: 避免频繁API请求
- **分页加载**: 每次只加载10条数据
- **缓存机制**: 避免重复请求相同数据

### 2. 渲染优化
- **虚拟滚动**: Element Plus Select 内置虚拟滚动
- **按需渲染**: 只渲染可见的选项
- **懒加载**: 首次打开时才加载数据

### 3. 内存优化
- **数据清理**: 搜索时清理旧数据
- **引用管理**: 避免内存泄漏

## API 接口

### 使用的后端接口

```typescript
// 搜索客户（支持分页和搜索）
GET /api/v1/customers?page=1&limit=10&search=关键词&sortBy=name&sortOrder=ASC

// 获取单个客户详情（用于回显）
GET /api/v1/customers/:id
```

### 搜索参数

- `page`: 页码（从1开始）
- `limit`: 每页数量（固定10）
- `search`: 搜索关键词（可选）
- `sortBy`: 排序字段（默认name）
- `sortOrder`: 排序方向（默认ASC）

## 应用场景

### 1. 新建合同页面
```vue
<!-- 合同表单中的客户选择 -->
<CustomerSelect
  v-model="form.customer_id"
  placeholder="请选择客户（支持搜索）"
  @change="handleCustomerChange"
/>
```

### 2. 合同列表筛选
```vue
<!-- 合同列表的客户筛选 -->
<CustomerSelect
  v-model="customerFilter"
  placeholder="选择客户筛选（支持搜索）"
  width="250px"
  @change="handleCustomerFilter"
/>
```

### 3. 发票管理
```vue
<!-- 发票中的客户选择 -->
<CustomerSelect
  v-model="invoiceForm.customer_id"
  placeholder="选择客户"
  @change="loadCustomerContracts"
/>
```

## 对比优化效果

### 优化前
- ❌ 一次性加载1000+客户数据
- ❌ 页面加载缓慢，内存占用高
- ❌ 下拉框滚动卡顿
- ❌ 搜索功能缺失

### 优化后
- ✅ 按需加载，每次10个客户
- ✅ 页面加载快速，内存占用低
- ✅ 流畅的滚动和搜索体验
- ✅ 智能搜索，快速定位客户

## 注意事项

1. **搜索关键词**: 支持客户名称、联系人、电话、邮箱的模糊搜索
2. **数据排序**: 默认按客户名称升序排列
3. **加载状态**: 组件会显示加载状态，提升用户体验
4. **错误处理**: API请求失败时会在控制台输出错误信息
5. **初始化**: 如果有初始值，组件会自动加载对应的客户信息

## 扩展建议

1. **缓存优化**: 可以添加客户数据的本地缓存
2. **虚拟滚动**: 对于超大数据集，可以考虑虚拟滚动
3. **多选支持**: 可以扩展为支持多选客户
4. **自定义显示**: 可以自定义客户信息的显示格式
5. **权限控制**: 可以根据用户权限过滤可选客户
