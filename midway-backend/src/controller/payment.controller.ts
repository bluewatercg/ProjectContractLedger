import { Controller, Get, Post, Put, Del, Body, Param, Query, Inject } from '@midwayjs/core';
import { Validate } from '@midwayjs/validate';
import { PaymentService } from '../service/payment.service';
import { CreatePaymentDto, UpdatePaymentDto, PaginationQuery, ApiResponse } from '../interface';

@Controller('/api/v1/payments')
export class PaymentController {
  @Inject()
  paymentService: PaymentService;

  /**
   * 创建支付记录
   */
  @Post('/')
  @Validate()
  async createPayment(@Body() createPaymentDto: CreatePaymentDto): Promise<ApiResponse> {
    try {
      const payment = await this.paymentService.createPayment(createPaymentDto);
      return {
        success: true,
        data: payment,
        message: '支付记录创建成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '支付记录创建失败',
        code: 400
      };
    }
  }

  /**
   * 获取支付记录列表
   */
  @Get('/')
  async getPayments(@Query() query: PaginationQuery & { invoiceId?: number; status?: string }): Promise<ApiResponse> {
    try {
      const result = await this.paymentService.getPayments(query);
      return {
        success: true,
        data: result,
        message: '获取支付记录列表成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取支付记录列表失败',
        code: 500
      };
    }
  }

  /**
   * 根据ID获取支付记录详情
   */
  @Get('/:id')
  async getPaymentById(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const payment = await this.paymentService.getPaymentById(id);
      if (!payment) {
        return {
          success: false,
          message: '支付记录不存在',
          code: 404
        };
      }
      return {
        success: true,
        data: payment,
        message: '获取支付记录详情成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取支付记录详情失败',
        code: 500
      };
    }
  }

  /**
   * 更新支付记录信息
   */
  @Put('/:id')
  @Validate()
  async updatePayment(
    @Param('id') id: number,
    @Body() updatePaymentDto: UpdatePaymentDto
  ): Promise<ApiResponse> {
    try {
      const payment = await this.paymentService.updatePayment(id, updatePaymentDto);
      if (!payment) {
        return {
          success: false,
          message: '支付记录不存在',
          code: 404
        };
      }
      return {
        success: true,
        data: payment,
        message: '支付记录信息更新成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '支付记录信息更新失败',
        code: 400
      };
    }
  }

  /**
   * 删除支付记录
   */
  @Del('/:id')
  async deletePayment(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const success = await this.paymentService.deletePayment(id);
      if (!success) {
        return {
          success: false,
          message: '支付记录不存在',
          code: 404
        };
      }
      return {
        success: true,
        message: '支付记录删除成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '支付记录删除失败',
        code: 400
      };
    }
  }

  /**
   * 根据发票ID获取支付记录
   */
  @Get('/invoice/:invoiceId')
  async getPaymentsByInvoiceId(@Param('invoiceId') invoiceId: number): Promise<ApiResponse> {
    try {
      const payments = await this.paymentService.getPaymentsByInvoiceId(invoiceId);
      return {
        success: true,
        data: payments,
        message: '获取支付记录成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取支付记录失败',
        code: 500
      };
    }
  }

  /**
   * 获取支付统计信息
   */
  @Get('/stats/overview')
  async getPaymentStats(): Promise<ApiResponse> {
    try {
      const stats = await this.paymentService.getPaymentStats();
      return {
        success: true,
        data: stats,
        message: '获取支付统计成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取支付统计失败',
        code: 500
      };
    }
  }
}
