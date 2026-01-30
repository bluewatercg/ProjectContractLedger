import { Controller, Get, Post, Query, Body, Inject } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { ReportService } from '../service/report.service';
import { ExportService } from '../service/export.service';
import { ApiResponse, ReportQueryParams, ExportReportDto } from '../interface';

@Controller('/api/v1/reports')
export class ReportController {
  @Inject()
  ctx: Context;

  @Inject()
  reportService: ReportService;

  @Inject()
  exportService: ExportService;

  /**
   * 获取合同报表
   */
  @Get('/contracts')
  async getContractReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: number
  ): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      const params: ReportQueryParams = {
        startDate,
        endDate,
        groupBy: (groupBy as any) || 'month',
        status,
        customerId,
        kitId,
      };

      const report = await this.reportService.getContractReport(params);
      return {
        success: true,
        data: report,
        message: '获取合同报表成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取合同报表失败',
        code: 500,
      };
    }
  }

  /**
   * 获取发票报表
   */
  @Get('/invoices')
  async getInvoiceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: string,
    @Query('status') status?: string
  ): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      const params: ReportQueryParams = {
        startDate,
        endDate,
        groupBy: (groupBy as any) || 'month',
        status,
        kitId,
      };

      const report = await this.reportService.getInvoiceReport(params);
      return {
        success: true,
        data: report,
        message: '获取发票报表成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取发票报表失败',
        code: 500,
      };
    }
  }

  /**
   * 获取支付报表
   */
  @Get('/payments')
  async getPaymentReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: string
  ): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      const params: ReportQueryParams = {
        startDate,
        endDate,
        groupBy: (groupBy as any) || 'month',
        kitId,
      };

      const report = await this.reportService.getPaymentReport(params);
      return {
        success: true,
        data: report,
        message: '获取支付报表成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取支付报表失败',
        code: 500,
      };
    }
  }

  /**
   * 获取对账报表
   */
  @Get('/reconciliations')
  async getReconciliationReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: string
  ): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      const params: ReportQueryParams = {
        startDate,
        endDate,
        groupBy: (groupBy as any) || 'month',
        kitId,
      };

      const report = await this.reportService.getReconciliationReport(params);
      return {
        success: true,
        data: report,
        message: '获取对账报表成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取对账报表失败',
        code: 500,
      };
    }
  }

  /**
   * 获取财务汇总报表
   */
  @Get('/financial-summary')
  async getFinancialSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: string
  ): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      const params: ReportQueryParams = {
        startDate,
        endDate,
        groupBy: (groupBy as any) || 'month',
        kitId,
      };

      const report = await this.reportService.getFinancialSummary(params);
      return {
        success: true,
        data: report,
        message: '获取财务汇总报表成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取财务汇总报表失败',
        code: 500,
      };
    }
  }

  /**
   * 导出报表
   */
  @Post('/export')
  async exportReport(@Body() dto: ExportReportDto): Promise<any> {
    try {
      const kitId = this.ctx.state?.kitId;
      const params: ReportQueryParams = {
        startDate: dto.startDate,
        endDate: dto.endDate,
        groupBy: (dto.groupBy as any) || 'month',
        kitId,
      };

      // 获取报表数据
      let reportData: any;
      switch (dto.reportType) {
        case 'contract':
          reportData = await this.reportService.getContractReport(params);
          break;
        case 'invoice':
          reportData = await this.reportService.getInvoiceReport(params);
          break;
        case 'payment':
          reportData = await this.reportService.getPaymentReport(params);
          break;
        case 'reconciliation':
          reportData = await this.reportService.getReconciliationReport(params);
          break;
        case 'financial':
          reportData = await this.reportService.getFinancialSummary(params);
          break;
        default:
          return {
            success: false,
            message: '不支持的报表类型',
            code: 400,
          };
      }

      // 导出文件
      let buffer: Buffer;
      let contentType: string;
      let filename: string;

      switch (dto.format) {
        case 'excel':
          buffer = await this.exportService.exportToExcel(
            reportData,
            dto.reportType
          );
          contentType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename = `${dto.reportType}_report_${Date.now()}.xlsx`;
          break;
        case 'pdf':
          buffer = await this.exportService.exportToPdf(
            reportData,
            dto.reportType
          );
          contentType = 'application/pdf';
          filename = `${dto.reportType}_report_${Date.now()}.pdf`;
          break;
        case 'csv':
          buffer = await this.exportService.exportToCsv(
            reportData,
            dto.reportType
          );
          contentType = 'text/csv';
          filename = `${dto.reportType}_report_${Date.now()}.csv`;
          break;
        default:
          return {
            success: false,
            message: '不支持的导出格式',
            code: 400,
          };
      }

      // 设置响应头
      this.ctx.set('Content-Type', contentType);
      this.ctx.set(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`
      );
      this.ctx.body = buffer;
    } catch (error) {
      return {
        success: false,
        message: error.message || '导出报表失败',
        code: 500,
      };
    }
  }

  /**
   * 清除报表缓存
   */
  @Post('/cache/clear')
  async clearCache(): Promise<ApiResponse> {
    try {
      this.reportService.clearCache();
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
}
