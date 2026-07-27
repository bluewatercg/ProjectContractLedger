import { DateUtil } from '../../src/util/date.util';

describe('DateUtil.formatDate', () => {
  it('formats Date objects as yyyy-MM-dd', () => {
    expect(DateUtil.formatDate(new Date(2026, 0, 15))).toBe('2026-01-15');
  });

  it('formats database date strings as yyyy-MM-dd', () => {
    expect(DateUtil.formatDate('2026-01-15')).toBe('2026-01-15');
  });
});
