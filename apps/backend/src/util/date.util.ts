export class DateUtil {
  static formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return date.split('T')[0];
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static parseDate(dateStr: string): Date {
    return new Date(dateStr);
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  static addYears(date: Date, years: number): Date {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  }

  static formatEntityResponse(obj: any): any {
    const result = { ...obj };
    for (const key in result) {
      if (result[key] instanceof Date) {
        result[key] = this.formatDate(result[key]);
      }
    }
    return result;
  }
}