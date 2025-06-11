/**
 * 日期处理工具类
 * 统一处理时区转换和日期格式化
 */
export class DateUtil {
  /**
   * 转换日期字符串为 Date 对象
   */
  static parseDate(dateStr: string | Date): Date | null {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    
    // 处理各种日期格式
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * 格式化日期为 yyyy-MM-dd 格式
   */
  static formatDateForResponse(date: Date): string | null {
    if (!date) return null;
    
    // 获取本地时间的年月日，格式化为 yyyy-MM-dd
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * 格式化包含日期字段的对象
   */
  static formatEntityResponse<T extends Record<string, any>>(
    entity: T,
    dateFields: (keyof T)[]
  ): T {
    const result = { ...entity };

    dateFields.forEach(field => {
      if (result[field]) {
        result[field] = this.formatDateForResponse(result[field]) as T[keyof T];
      }
    });

    return result;
  }
}
