const toDateParts = (value: string): [number, number, number] => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return [year, month, day]
}

const daysInMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate()

export const formatSubscriptionDuration = (startDate?: string | null, expiryDate?: string | null): string => {
  if (!startDate) return '未设置起始日期'
  if (!expiryDate) return '未设置到期日'

  const [startYear, startMonth, startDay] = toDateParts(startDate)
  const [expiryYear, expiryMonth, expiryDay] = toDateParts(expiryDate)
  const start = Date.UTC(startYear, startMonth - 1, startDay)
  const expiry = Date.UTC(expiryYear, expiryMonth - 1, expiryDay)
  if (start > expiry) return '日期范围无效'
  if (start === expiry) return '0 天'

  let years = expiryYear - startYear
  let months = expiryMonth - startMonth
  let anchorDay = startDay
  if (anchorDay > daysInMonth(startYear + years, startMonth + months)) {
    anchorDay = daysInMonth(startYear + years, startMonth + months)
  }
  let anchor = Date.UTC(startYear + years, startMonth - 1 + months, anchorDay)
  if (anchor > expiry) {
    months -= 1
    anchorDay = Math.min(startDay, daysInMonth(startYear + years, startMonth - 1 + months))
    anchor = Date.UTC(startYear + years, startMonth - 1 + months, anchorDay)
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  const days = Math.round((expiry - anchor) / 86400000)
  const parts: string[] = []
  if (years) parts.push(`${years} 年`)
  if (months) parts.push(`${months} 个月`)
  if (days) parts.push(`${days} 天`)
  return parts.join(' ') || '0 天'
}
