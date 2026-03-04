<template>
  <div class="report-chart">
    <el-card shadow="never">
      <template #header>
        <div class="chart-header">
          <span class="chart-title">{{ title }}</span>
          <div class="chart-actions">
            <el-radio-group v-model="currentChartType" size="small" @change="handleChartTypeChange">
              <el-radio-button v-if="supportedTypes.includes('bar')" value="bar">
                柱状图
              </el-radio-button>
              <el-radio-button v-if="supportedTypes.includes('line')" value="line">
                折线图
              </el-radio-button>
              <el-radio-button v-if="supportedTypes.includes('pie')" value="pie">
                饼图
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <div v-loading="loading" class="report-chart-container" :style="{ minHeight: height }">
        <div
          v-show="!isEmpty"
          ref="chartRef"
          class="report-chart-canvas"
          :style="{ height: height }"
        ></div>
        <el-empty v-if="!loading && isEmpty" description="暂无数据" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

// Props
interface Props {
  title?: string
  data: any[]
  chartType?: 'bar' | 'line' | 'pie'
  supportedTypes?: ('bar' | 'line' | 'pie')[]
  height?: string
  loading?: boolean
  xAxisKey?: string
  yAxisKey?: string
  seriesName?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '数据图表',
  chartType: 'bar',
  supportedTypes: () => ['bar', 'line', 'pie'],
  height: '400px',
  loading: false,
  xAxisKey: 'periodLabel',
  yAxisKey: 'amount',
  seriesName: '数据'
})

// State
const chartRef = ref<HTMLElement>()
const chartInstance = ref<echarts.ECharts>()
const currentChartType = ref(props.chartType)
let resizeObserver: ResizeObserver | null = null

// Computed
const isEmpty = computed(() => !props.data || props.data.length === 0)

// Methods
const initChart = () => {
  if (!chartRef.value) return

  chartInstance.value?.dispose()
  chartInstance.value = echarts.init(chartRef.value)
  bindResizeObserver()
  updateChart()
  nextTick(() => {
    handleResize()
    updateChart()
  })

  // Handle window resize
  window.addEventListener('resize', handleResize)
}

const updateChart = () => {
  if (!chartInstance.value) return
  if (isEmpty.value) {
    chartInstance.value.clear()
    return
  }

  const option = getChartOption()
  chartInstance.value.resize()
  chartInstance.value.setOption(option, true)
}

const getChartOption = (): EChartsOption => {
  switch (currentChartType.value) {
    case 'bar':
      return getBarOption()
    case 'line':
      return getLineOption()
    case 'pie':
      return getPieOption()
    default:
      return getBarOption()
  }
}

const getBarOption = (): EChartsOption => {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.map(item => item[props.xAxisKey]),
      axisLabel: {
        rotate: props.data.length > 10 ? 45 : 0
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: props.seriesName,
        type: 'bar',
        data: props.data.map(item => item[props.yAxisKey]),
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  }
}

const getLineOption = (): EChartsOption => {
  return {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.map(item => item[props.xAxisKey]),
      boundaryGap: false
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: props.seriesName,
        type: 'line',
        data: props.data.map(item => item[props.yAxisKey]),
        smooth: true,
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      }
    ]
  }
}

const getPieOption = (): EChartsOption => {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: props.seriesName,
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: props.data.map(item => ({
          name: item[props.xAxisKey],
          value: item[props.yAxisKey]
        }))
      }
    ]
  }
}

const handleChartTypeChange = () => {
  updateChart()
}

const handleResize = () => {
  chartInstance.value?.resize()
}

const bindResizeObserver = () => {
  if (typeof ResizeObserver === 'undefined' || !chartRef.value) return
  const target = chartRef.value.parentElement
  if (!target) return

  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(() => {
    handleResize()
  })
  resizeObserver.observe(target)
}

// Lifecycle
onMounted(() => {
  initChart()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  resizeObserver?.disconnect()
  resizeObserver = null
  chartInstance.value?.dispose()
})

// Watch data changes
watch(() => props.data, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

watch(() => props.loading, (newVal) => {
  if (!newVal) {
    nextTick(() => {
      updateChart()
    })
  }
})

watch(() => currentChartType.value, () => {
  nextTick(() => {
    updateChart()
  })
})
</script>

<style scoped>
.report-chart {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.report-chart-container {
  width: 100%;
}

.report-chart-canvas {
  width: 100%;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
