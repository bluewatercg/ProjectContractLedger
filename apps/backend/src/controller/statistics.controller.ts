import { Controller, Get, Post, Query, Inject } from '@midwayjs/decorator';
import { StatisticsService } from '../service/statistics.service';
import { ApiResponse } from '../interface';

@Controller('/api/v1/statistics')
export class StatisticsController {
  @Inject()
  statisticsService: StatisticsService;

  /**
   * 获取仪表板统计数据
   */
  @Get('/dashboard')
  async getDashboardStats(@Query('year') year?: number): Promise<ApiResponse> {
    try {
      const stats = await this.statisticsService.getDashboardStats(year);
      return {
        success: true,
        data: stats,
        message: '获取仪表板统计数据成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取仪表板统计数据失败',
        code: 500,
      };
    }
  }

  /**
   * 获取月度收入趋势（固定12个月）
   */
  @Get('/revenue/trend')
  async getMonthlyRevenueTrend(
    @Query('year') year?: number
  ): Promise<ApiResponse> {
    try {
      const targetYear = year || new Date().getFullYear();
      const trend =
        await this.statisticsService.getMonthlyRevenueTrend(targetYear);
      return {
        success: true,
        data: trend,
        message: '获取月度收入趋势成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取月度收入趋势失败',
        code: 500,
      };
    }
  }

  /**
   * 获取客户贡献统计（Top 5）
   */
  @Get('/customers/contribution')
  async getCustomerContribution(
    @Query('year') year?: number,
    @Query('limit') limit?: number
  ): Promise<ApiResponse> {
    try {
      const targetYear = year || new Date().getFullYear();
      const contribution = await this.statisticsService.getCustomerContribution(
        targetYear,
        limit || 5
      );
      return {
        success: true,
        data: contribution,
        message: '获取客户贡献统计成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取客户贡献统计失败',
        code: 500,
      };
    }
  }

  /**
   * 获取合同状态分布
   */
  @Get('/contracts/status')
  async getContractStatusDistribution(
    @Query('year') year?: number
  ): Promise<ApiResponse> {
    try {
      const targetYear = year || new Date().getFullYear();
      const distribution =
        await this.statisticsService.getContractStatusDistribution(targetYear);
      return {
        success: true,
        data: distribution,
        message: '获取合同状态分布成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取合同状态分布失败',
        code: 500,
      };
    }
  }

  /**
   * 获取发票状态分布
   */
  @Get('/invoices/status')
  async getInvoiceStatusDistribution(
    @Query('year') year?: number
  ): Promise<ApiResponse> {
    try {
      const targetYear = year || new Date().getFullYear();
      const distribution =
        await this.statisticsService.getInvoiceStatusDistribution(targetYear);
      return {
        success: true,
        data: distribution,
        message: '获取发票状态分布成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取发票状态分布失败',
        code: 500,
      };
    }
  }

  /**
   * 获取支付方式统计
   */
  @Get('/payments/methods')
  async getPaymentMethodStats(): Promise<ApiResponse> {
    try {
      const stats = await this.statisticsService.getPaymentMethodStats();
      return {
        success: true,
        data: stats,
        message: '获取支付方式统计成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取支付方式统计失败',
        code: 500,
      };
    }
  }

  /**
   * 获取逾期发票提醒
   */
  @Get('/alerts/overdue')
  async getOverdueInvoicesAlert(): Promise<ApiResponse> {
    try {
      const alert = await this.statisticsService.getOverdueInvoicesAlert();
      return {
        success: true,
        data: alert,
        message: '获取逾期发票提醒成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取逾期发票提醒失败',
        code: 500,
      };
    }
  }

  /**
   * 清除统计数据缓存
   */
  @Post('/cache/clear')
  async clearCache(): Promise<ApiResponse> {
    try {
      this.statisticsService.clearCache();
      return {
        success: true,
        message: '缓存清除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '缓存清除失败',
        code: 500,
      };
    }
  }

  /**
   * 获取可用年份列表
   */
  @Get('/available-years')
  async getAvailableYears(): Promise<ApiResponse> {
    try {
      const years = await this.statisticsService.getAvailableYears();
      return {
        success: true,
        data: years,
        message: '获取可用年份列表成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取可用年份列表失败',
        code: 500,
      };
    }
  }
}
