# UI 设计系统快速参考

## 🎨 常用颜色

```css
/* 主色调 */
--color-primary: #409eff

/* 文本颜色 */
--color-text-primary: #303133      /* 主要文本 */
--color-text-regular: #606266      /* 常规文本 */
--color-text-secondary: #909399    /* 次要文本 */
--color-text-placeholder: #c0c4cc  /* 占位文本 */

/* 背景颜色 */
--color-bg-page: #f5f7fa          /* 页面背景 */
--color-bg-container: #ffffff     /* 容器背景 */
--color-bg-hover: #f5f7fa         /* 悬浮背景 */

/* 边框颜色 */
--color-border-base: #dcdfe6
--color-border-light: #e4e7ed
--color-border-lighter: #ebeef5
```

## 📏 常用间距

```css
--spacing-1: 4px
--spacing-2: 8px
--spacing-3: 12px
--spacing-4: 16px   /* 最常用 */
--spacing-5: 20px
--spacing-6: 24px   /* 最常用 */
--spacing-8: 32px
```

## 🔲 圆角

```css
--radius-sm: 4px      /* 小元素 */
--radius-base: 8px    /* 标准元素（最常用）*/
--radius-lg: 12px     /* 大元素 */
--radius-full: 9999px /* 圆形 */
```

## 🌑 阴影

```css
--shadow-base: 0 2px 8px rgba(0, 0, 0, 0.1)    /* 标准阴影（最常用）*/
--shadow-hover: 0 4px 16px rgba(0, 0, 0, 0.15) /* 悬浮阴影 */
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.15)    /* 大阴影 */
```

## 📝 字体大小

```css
--font-size-xs: 12px
--font-size-sm: 14px
--font-size-base: 16px   /* 标准大小 */
--font-size-lg: 18px
--font-size-xl: 20px
--font-size-2xl: 24px    /* 标题 */
--font-size-3xl: 30px
--font-size-4xl: 36px
```

## 💪 字重

```css
--font-weight-normal: 400    /* 正常文本 */
--font-weight-medium: 500    /* 中等强调 */
--font-weight-semibold: 600  /* 标题 */
--font-weight-bold: 700      /* 强调 */
```

## ⚡ 过渡动画

```css
--transition-fast: 150ms
--transition-base: 250ms     /* 标准速度 */
--transition-slow: 350ms

/* 预定义过渡 */
--transition-all: all var(--transition-base)
--transition-colors: color, background-color, border-color
--transition-transform: transform var(--transition-base)
```

## 📱 响应式断点

```css
--breakpoint-xs: 480px
--breakpoint-sm: 640px
--breakpoint-md: 768px   /* 平板 */
--breakpoint-lg: 1024px  /* 桌面 */
--breakpoint-xl: 1280px
--breakpoint-2xl: 1536px
```

## 🛠️ 常用工具类

```css
/* 文本对齐 */
.text-center
.text-right
.text-left

/* 外边距 */
.m-0, .m-1, .m-2, .m-3, .m-4, .m-5, .m-6
.mt-0, .mt-1, .mt-2, .mt-3, .mt-4, .mt-5, .mt-6
.mb-0, .mb-1, .mb-2, .mb-3, .mb-4, .mb-5, .mb-6

/* 内边距 */
.p-0, .p-1, .p-2, .p-3, .p-4, .p-5, .p-6
```

## 📦 常用布局类

```css
/* 页面容器 */
.page-container
.page-header
.page-title

/* 表格容器 */
.table-container
.table-toolbar
.table-search

/* 表单容器 */
.form-container
.form-section
.form-actions

/* 卡片 */
.card-grid
.stat-card

/* 详情页 */
.detail-container
.detail-section
.detail-grid
```

## 🎯 使用示例

### 创建一个卡片

```vue
<template>
  <div class="stat-card">
    <div class="stat-card-header">
      <span class="stat-card-title">总收入</span>
      <el-icon class="stat-card-icon"><Money /></el-icon>
    </div>
    <div class="stat-card-value">¥123,456</div>
    <div class="stat-card-change">较上月增长 12%</div>
  </div>
</template>

<style scoped>
/* 无需额外样式，使用全局样式即可 */
</style>
```

### 创建一个表单

```vue
<template>
  <div class="form-container">
    <div class="form-section">
      <h3 class="form-section-title">基本信息</h3>
      <el-form>
        <!-- 表单内容 -->
      </el-form>
    </div>
    <div class="form-actions">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="submit">提交</el-button>
    </div>
  </div>
</template>
```

### 自定义样式

```vue
<style scoped>
.custom-card {
  background: var(--color-bg-container);
  border-radius: var(--radius-base);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-base);
  transition: var(--transition-all);
}

.custom-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.custom-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-4);
}
</style>
```

## 📚 完整文档

详细的优化报告请查看：`UI_OPTIMIZATION_REPORT.md`

## 🔗 相关文件

- `src/styles/design-system.css` - 设计系统变量定义
- `src/styles/element-theme.css` - Element Plus 主题定制
- `src/styles/index.css` - 全局样式
- `src/styles/page.css` - 页面特定样式
