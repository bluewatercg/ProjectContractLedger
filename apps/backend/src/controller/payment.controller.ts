import {
  Controller,
  Get,
  Post,
  Put,
  Del,
  Body,
  Param,
  Query,
  Inject,
} from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { Validate } from '@midwayjs/validate';
import { PaymentService } from '../service/payment.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaginationQuery,
  ApiResponse,
} from '../interface';

@Controller('/api/v1/payments')
export class PaymentController {
  @Inject()
  paymentService: PaymentService;

  @Inject()
  ctx: Context;

  /**
   * 创建支付记录
   */
  @Post('/')
  @Validate()
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto
  ): Promise<ApiResponse> {
    try {
      // 优先使用发票的 kit_id，如果没有则使用当前用户的 kit_id
      let kitId = this.ctx.state?.kitId;

      // 如果提供了 invoice_id，获取发票的 kit_id
      if (createPaymentDto.invoice_id) {
        const invoice = await this.paymentService.getInvoiceById(
          createPaymentDto.invoice_id
        );
        if (invoice && invoice.kit_id) {
          kitId = invoice.kit_id;
        }
      }

      if (!kitId) {
        return {
          success: false,
          message: '请选择套装或选择有效的发票',
          code: 400,
        };
      }

      const payment = await this.paymentService.createPayment(createPaymentDto, kitId);
      return {
        success: true,
        data: payment,
        message: '支付记录创建成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '支付记录创建失败',
        code: 400,
      };
    }
  }

  /**
   * 获取支付记录列表
   */
  @Get('/')
  async getPayments(
    @Query() query: PaginationQuery & { invoiceId?: number; status?: string; viewAll?: string }
  ): Promise<ApiResponse> {
    try {
      // 如果 viewAll=true，则不传 kitId（查看全部套账）
      const kitId = query.viewAll === 'true' ? undefined : this.ctx.state?.kitId;
      const result = await this.paymentService.getPayments(query, kitId);
      return {
        success: true,
        data: result,
        message: '获取支付记录列表成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取支付记录列表失败',
        code: 500,
      };
    }
  }

  /**
   * 根据ID获取支付记录详情
   */
  @Get('/:id')
  async getPaymentById(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      const payment = await this.paymentService.getPaymentById(id, kitId);
      if (!payment) {
        return {
          success: false,
          message: '支付记录不存在',
          code: 404,
        };
      }
      return {
        success: true,
        data: payment,
        message: '获取支付记录详情成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取支付记录详情失败',
        code: 500,
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
      const kitId = this.ctx.state?.kitId;
      const payment = await this.paymentService.updatePayment(
        id,
        updatePaymentDto,
        kitId
      );
      if (!payment) {
        return {
          success: false,
          message: '支付记录不存在',
          code: 404,
        };
      }
      return {
        success: true,
        data: payment,
        message: '支付记录信息更新成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '支付记录信息更新失败',
        code: 400,
      };
    }
  }

  /**
   * 删除支付记录
   */
  @Del('/:id')
  async deletePayment(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      const success = await this.paymentService.deletePayment(id, kitId);
      if (!success) {
        return {
          success: false,
          message: '支付记录不存在',
          code: 404,
        };
      }
      return {
        success: true,
        message: '支付记录删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '支付记录删除失败',
        code: 400,
      };
    }
  }

  /**
   * 根据发票ID获取支付记录
   */
  @Get('/invoice/:invoiceId')
  async getPaymentsByInvoiceId(
    @Param('invoiceId') invoiceId: number
  ): Promise<ApiResponse> {
    try {
      const payments = await this.paymentService.getPaymentsByInvoiceId(
        invoiceId
      );
      return {
        success: true,
        data: payments,
        message: '获取支付记录成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取支付记录失败',
        code: 500,
      };
    }
  }

  /**
   * 获取支付统计信息
   */
  @Get('/stats/overview')
  async getPaymentStats(
    @Query() query: { viewAll?: string }
  ): Promise<ApiResponse> {
    try {
      // 如果 viewAll=true，则不传 kitId（查看全部套账）
      const kitId = query.viewAll === 'true' ? undefined : this.ctx.state?.kitId;
      const stats = await this.paymentService.getPaymentStats(undefined, kitId);
      return {
        success: true,
        data: stats,
        message: '获取支付统计成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取支付统计失败',
        code: 500,
      };
    }
  }
}
