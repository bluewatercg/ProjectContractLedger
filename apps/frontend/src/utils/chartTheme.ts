/**
 * ECharts 现代化主题配置
 * 适用于企业级合同管理系统的数据可视化
 */

import type { EChartsOption } from 'echarts'

// 主题色板
export const chartColors = {
  primary: ['#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4'],
  blue: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'],
  green: ['#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0'],
  orange: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'],
  purple: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'],
  gradient: {
    blue: ['#3B82F6', '#60A5FA'],
    green: ['#22C55E', '#4ADE80'],
    orange: ['#F59E0B', '#FBBF24'],
    purple: ['#8B5CF6', '#A78BFA']
  }
}

// 全局配置
export const globalChartConfig: Partial<EChartsOption> = {
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 14,
    color: '#475569'
  },
  animation: true,
  animationDuration: 800,
  animationEasing: 'cubicOut'
}

// Tooltip 配置
export const tooltipConfig: Partial<EChartsOption['tooltip']> = {
  trigger: 'axis',
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  borderWidth: 0,
  textStyle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 500
  },
  padding: [12, 16],
  borderRadius: 8,
  extraCssText: 'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);',
  axisPointer: {
    type: 'cross',
    lineStyle: {
      color: '#94A3B8',
      type: 'dashed'
    },
    crossStyle: {
      color: '#94A3B8'
    }
  }
}

// Grid 配置
export const gridConfig: Partial<EChartsOption['grid']> = {
  left: '3%',
  right: '4%',
  bottom: '3%',
  top: '10%',
  containLabel: true
}

// 折线图配置
export const lineChartConfig = {
  smooth: true,
  symbol: 'circle',
  symbolSize: 8,
  lineStyle: {
    width: 3,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowBlur: 10,
    shadowOffsetY: 5
  },
  areaStyle: {
    opacity: 0.1
  },
  emphasis: {
    focus: 'series',
    scale: true,
    scaleSize: 12,
    lineStyle: {
      width: 4
    }
  }
}

// 柱状图配置
export const barChartConfig = {
  barBorderRadius: [8, 8, 0, 0],
  barMaxWidth: 40,
  itemStyle: {
    borderRadius: 8,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowBlur: 10,
    shadowOffsetY: 5
  },
  emphasis: {
    itemStyle: {
      shadowBlur: 20,
      shadowOffsetY: 10
    }
  }
}

// 饼图配置
export const pieChartConfig = {
  radius: ['45%', '70%'],
  avoidLabelOverlap: true,
  itemStyle: {
    borderRadius: 10,
    borderColor: '#fff',
    borderWidth: 3,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowBlur: 10
  },
  label: {
    show: true,
    fontSize: 14,
    fontWeight: 600,
    formatter: '{b}\n{d}%'
  },
  emphasis: {
    label: {
      show: true,
      fontSize: 16,
      fontWeight: 700
    },
    itemStyle: {
      shadowBlur: 20,
      shadowOffsetX: 0,
      shadowColor: 'rgba(0, 0, 0, 0.3)'
    }
  }
}

// 创建渐变色
export function createGradient(colors: string[], direction: 'vertical' | 'horizontal' = 'vertical') {
  return {
    type: 'linear',
    x: 0,
    y: direction === 'vertical' ? 0 : 0,
    x2: direction === 'horizontal' ? 1 : 0,
    y2: direction === 'vertical' ? 1 : 0,
    colorStops: colors.map((color, index) => ({
      offset: index / (colors.length - 1),
      color
    }))
  }
}

// 创建现代折线图
export function createModernLineChart(data: {
  months: string[]
  series: Array<{ name: string; data: number[]; color?: string }>
}): EChartsOption {
  return {
    ...globalChartConfig,
    color: chartColors.primary,
    tooltip: tooltipConfig,
    legend: {
      data: data.series.map(s => s.name),
      bottom: '5%',
      textStyle: {
        fontSize: 14,
        color: '#475569'
      },
      itemWidth: 20,
      itemHeight: 12,
      itemGap: 20
    },
    grid: gridConfig,
    xAxis: {
      type: 'category',
      data: data.months,
      axisLine: {
        lineStyle: {
          color: '#E2E8F0'
        }
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 12,
        margin: 12
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#F1F5F9',
          type: 'dashed'
        }
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 12,
        formatter: (value: number) => {
          if (value >= 10000) {
            return (value / 10000).toFixed(1) + '万'
          }
          return value.toString()
        }
      }
    },
    series: data.series.map((item, index) => ({
      name: item.name,
      type: 'line',
      data: item.data,
      ...lineChartConfig,
      itemStyle: {
        color: item.color || chartColors.primary[index]
      },
      areaStyle: {
        color: createGradient([
          item.color || chartColors.primary[index] + '40',
          item.color || chartColors.primary[index] + '10'
        ])
      }
    }))
  }
}

// 创建现代柱状图
export function createModernBarChart(data: {
  categories: string[]
  series: Array<{ name: string; data: number[]; color?: string }>
}): EChartsOption {
  return {
    ...globalChartConfig,
    color: chartColors.primary,
    tooltip: {
      ...tooltipConfig,
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: data.series.map(s => s.name),
      bottom: '5%',
      textStyle: {
        fontSize: 14,
        color: '#475569'
      }
    },
    grid: gridConfig,
    xAxis: {
      type: 'category',
      data: data.categories,
      axisLine: {
        lineStyle: {
          color: '#E2E8F0'
        }
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 12
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#F1F5F9',
          type: 'dashed'
        }
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 12,
        formatter: (value: number) => {
          if (value >= 10000) {
            return (value / 10000).toFixed(1) + '万'
          }
          return value.toString()
        }
      }
    },
    series: data.series.map((item, index) => ({
      name: item.name,
      type: 'bar',
      data: item.data,
      ...barChartConfig,
      itemStyle: {
        ...barChartConfig.itemStyle,
        color: createGradient(
          chartColors.gradient[Object.keys(chartColors.gradient)[index % 4] as keyof typeof chartColors.gradient]
        )
      }
    }))
  }
}

// 创建现代饼图
export function createModernPieChart(data: Array<{ name: string; value: number }>): EChartsOption {
  return {
    ...globalChartConfig,
    color: chartColors.primary,
    tooltip: {
      ...tooltipConfig,
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      bottom: '5%',
      left: 'center',
      textStyle: {
        fontSize: 14,
        color: '#475569'
      },
      itemWidth: 12,
      itemHeight: 12
    },
    series: [
      {
        name: '数据分布',
        type: 'pie',
        ...pieChartConfig,
        data: data
      }
    ]
  }
}

// 创建环形进度图
export function createRingProgressChart(data: { name: string; value: number; total: number }): EChartsOption {
  const percentage = ((data.value / data.total) * 100).toFixed(1)

  return {
    ...globalChartConfig,
    tooltip: {
      ...tooltipConfig,
      trigger: 'item',
      formatter: `${data.name}: ${data.value} / ${data.total} (${percentage}%)`
    },
    series: [
      {
        name: data.name,
        type: 'pie',
        radius: ['60%', '80%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'center',
          formatter: `{value|${percentage}%}\n{name|${data.name}}`,
          rich: {
            value: {
              fontSize: 32,
              fontWeight: 700,
              color: '#0F172A',
              lineHeight: 40
            },
            name: {
              fontSize: 14,
              color: '#64748B',
              lineHeight: 20
            }
          }
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 36
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: data.value,
            name: data.name,
            itemStyle: {
              color: createGradient(chartColors.gradient.blue),
              borderRadius: 10
            }
          },
          {
            value: data.total - data.value,
            name: '剩余',
            itemStyle: {
              color: '#F1F5F9',
              borderRadius: 10
            },
            label: {
              show: false
            },
            emphasis: {
              itemStyle: {
                color: '#E2E8F0'
              }
            }
          }
        ]
      }
    ]
  }
}

// 格式化货币
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// 格式化数字
export function formatNumber(value: number): string {
  if (value >= 100000000) {
    return (value / 100000000).toFixed(2) + '亿'
  }
  if (value >= 10000) {
    return (value / 10000).toFixed(2) + '万'
  }
  return value.toLocaleString('zh-CN')
}
