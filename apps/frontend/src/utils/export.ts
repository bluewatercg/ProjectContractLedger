import { ElMessage } from 'element-plus'
import { reportApi } from '@/api/report'
import type { ExportReportDto } from '@/api/types'

/**
 * 下载文件工具函数
 */
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 导出报表封装
 */
export const exportReport = async (
  reportType: 'contract' | 'invoice' | 'payment' | 'reconciliation' | 'financial',
  format: 'excel' | 'pdf' | 'csv',
  params: {
    startDate?: string
    endDate?: string
    groupBy?: 'day' | 'month' | 'quarter' | 'year'
  }
) => {
  try {
    const dto: ExportReportDto = {
      reportType,
      format,
      startDate: params.startDate,
      endDate: params.endDate,
      groupBy: params.groupBy || 'month'
    }

    ElMessage.info('正在生成导出文件，请稍候...')

    const blob = await reportApi.exportReport(dto)

    // 生成文件名
    const timestamp = new Date().getTime()
    const reportNames = {
      contract: '合同报表',
      invoice: '发票报表',
      payment: '支付报表',
      reconciliation: '对账报表',
      financial: '财务汇总报表'
    }
    const extensions = {
      excel: 'xlsx',
      pdf: 'pdf',
      csv: 'csv'
    }

    const filename = `${reportNames[reportType]}_${timestamp}.${extensions[format]}`

    downloadFile(blob, filename)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('Export error:', error)
    ElMessage.error('导出失败，请重试')
  }
}

/**
 * 格式化金额
 */
export const formatAmount = (amount: number): string => {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * 格式化百分比
 */
export const formatPercentage = (value: number): string => {
  return value.toFixed(2) + '%'
}

/**
 * 格式化日期
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '-'
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化日期时间
 */
export const formatDateTime = (date: string | Date): string => {
  if (!date) return '-'
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}
