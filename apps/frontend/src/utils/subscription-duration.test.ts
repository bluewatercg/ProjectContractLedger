import { formatSubscriptionDuration } from './subscription-duration'

describe('formatSubscriptionDuration', () => {
  it('formats a calendar month', () => {
    expect(formatSubscriptionDuration('2026-09-13', '2026-10-13')).toBe('1 个月')
  })

  it('reports missing legacy start dates', () => {
    expect(formatSubscriptionDuration(null, '2026-10-13')).toBe('未设置起始日期')
  })

  it('handles remaining days after full months', () => {
    expect(formatSubscriptionDuration('2026-09-13', '2026-10-18')).toBe('1 个月 5 天')
  })
})
