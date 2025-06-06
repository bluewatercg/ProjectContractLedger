import { Controller, Get, Post, Put, Del, Body, Param, Query, Inject } from '@midwayjs/core';
import { Validate } from '@midwayjs/validate';
import { InvoiceService } from '../service/invoice.service';
import { CreateInvoiceDto, UpdateInvoiceDto, PaginationQuery, ApiResponse } from '../interface';

@Controller('/api/v1/invoices')
export class InvoiceController {
  @Inject()
  invoiceService: InvoiceService;

  /**
   * 创建发票
   */
  @Post('/')
  @Validate()
  async createInvoice(@Body() createInvoiceDto: CreateInvoiceDto): Promise<ApiResponse> {
    try {
      const invoice = await this.invoiceService.createInvoice(createInvoiceDto);
      return {
        success: true,
        data: invoice,
        message: '发票创建成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '发票创建失败',
        code: 400
      };
    }
  }

  /**
   * 获取发票列表
   */
  @Get('/')
  async getInvoices(@Query() query: PaginationQuery & { contractId?: number; status?: string }): Promise<ApiResponse> {
    try {
      const result = await this.invoiceService.getInvoices(query);
      return {
        success: true,
        data: result,
        message: '获取发票列表成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取发票列表失败',
        code: 500
      };
    }
  }

  /**
   * 根据ID获取发票详情
   */
  @Get('/:id')
  async getInvoiceById(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const invoice = await this.invoiceService.getInvoiceById(id);
      if (!invoice) {
        return {
          success: false,
          message: '发票不存在',
          code: 404
        };
      }
      return {
        success: true,
        data: invoice,
        message: '获取发票详情成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取发票详情失败',
        code: 500
      };
    }
  }

  /**
   * 更新发票信息
   */
  @Put('/:id')
  @Validate()
  async updateInvoice(
    @Param('id') id: number,
    @Body() updateInvoiceDto: UpdateInvoiceDto
  ): Promise<ApiResponse> {
    try {
      const invoice = await this.invoiceService.updateInvoice(id, updateInvoiceDto);
      if (!invoice) {
        return {
          success: false,
          message: '发票不存在',
          code: 404
        };
      }
      return {
        success: true,
        data: invoice,
        message: '发票信息更新成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '发票信息更新失败',
        code: 400
      };
    }
  }

  /**
   * 删除发票
   */
  @Del('/:id')
  async deleteInvoice(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const success = await this.invoiceService.deleteInvoice(id);
      if (!success) {
        return {
          success: false,
          message: '发票不存在',
          code: 404
        };
      }
      return {
        success: true,
        message: '发票删除成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '发票删除失败',
        code: 400
      };
    }
  }

  /**
   * 获取发票统计信息
   */
  @Get('/stats/overview')
  async getInvoiceStats(): Promise<ApiResponse> {
    try {
      const stats = await this.invoiceService.getInvoiceStats();
      return {
        success: true,
        data: stats,
        message: '获取发票统计成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取发票统计失败',
        code: 500
      };
    }
  }

  /**
   * 获取逾期发票
   */
  @Get('/overdue/list')
  async getOverdueInvoices(): Promise<ApiResponse> {
    try {
      const invoices = await this.invoiceService.getOverdueInvoices();
      return {
        success: true,
        data: invoices,
        message: '获取逾期发票成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取逾期发票失败',
        code: 500
      };
    }
  }
}
