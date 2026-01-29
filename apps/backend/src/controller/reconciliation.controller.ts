import {
  Controller,
  Post,
  Get,
  Put,
  Inject,
  Query,
  Body,
  Param,
} from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { Validate } from '@midwayjs/validate';
import { ReconciliationService } from '../service/reconciliation.service';
import { ApiResponse } from '../interface';

@Controller('/api/v1/reconciliations')
export class ReconciliationController {
  @Inject()
  reconciliationService: ReconciliationService;

  @Inject()
  ctx: Context;

  /**
   * 自动对账 - 单张发票
   * POST /api/v1/reconciliations/auto/:invoiceId
   */
  @Post('/auto/:invoiceId')
  async autoReconcile(
    @Param('invoiceId') invoiceId: number
  ): Promise<ApiResponse> {
    try {
      const userId = this.ctx.state.user.userId;
      const reconciliation = await this.reconciliationService.autoReconcile(
        invoiceId,
        userId
      );

      return {
        success: true,
        message: '自动对账成功',
        data: reconciliation,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '自动对账失败',
        code: 400,
      };
    }
  }

  /**
   * 批量自动对账
   * POST /api/v1/reconciliations/batch-auto
   */
  @Post('/batch-auto')
  @Validate()
  async batchAutoReconcile(
    @Body() body: { invoiceIds: number[] }
  ): Promise<ApiResponse> {
    try {
      const userId = this.ctx.state.user.userId;
      const result = await this.reconciliationService.batchAutoReconcile(
        body.invoiceIds,
        userId
      );

      return {
        success: true,
        message: `批量对账完成，成功: ${result.success}，失败: ${result.failed}`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '批量对账失败',
        code: 400,
      };
    }
  }

  /**
   * 手动对账
   * POST /api/v1/reconciliations/manual
   */
  @Post('/manual')
  @Validate()
  async manualReconcile(
    @Body()
    body: {
      invoiceId: number;
      paymentIds: number[];
      differenceReason?: string;
      notes?: string;
    }
  ): Promise<ApiResponse> {
    try {
      const userId = this.ctx.state.user.userId;
      const reconciliation = await this.reconciliationService.manualReconcile({
        ...body,
        userId,
      });

      return {
        success: true,
        message: '手动对账成功',
        data: reconciliation,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '手动对账失败',
        code: 400,
      };
    }
  }

  /**
   * 获取对账列表
   * GET /api/v1/reconciliations
   */
  @Get('/')
  async getReconciliations(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: string,
    @Query('approvalStatus') approvalStatus?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse> {
    try {
      const result = await this.reconciliationService.getReconciliations({
        page,
        pageSize,
        status,
        approvalStatus,
        startDate,
        endDate,
      });

      return {
        success: true,
        data: result.data,
        total: result.total,
        page: page || 1,
        pageSize: pageSize || 20,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取对账列表失败',
        code: 500,
      };
    }
  }

  /**
   * 获取对账详情
   * GET /api/v1/reconciliations/:id
   */
  @Get('/:id')
  async getReconciliationById(
    @Param('id') id: number
  ): Promise<ApiResponse> {
    try {
      const reconciliation =
        await this.reconciliationService.getReconciliationById(id);

      if (!reconciliation) {
        return {
          success: false,
          message: '对账记录不存在',
          code: 404,
        };
      }

      return {
        success: true,
        data: reconciliation,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取对账详情失败',
        code: 500,
      };
    }
  }

  /**
   * 处理对账差异
   * PUT /api/v1/reconciliations/:id/handle-difference
   */
  @Put('/:id/handle-difference')
  @Validate()
  async handleDifference(
    @Param('id') id: number,
    @Body()
    body: {
      action: 'adjust_invoice' | 'refund' | 'write_off' | 'wait_payment';
      reason: string;
    }
  ): Promise<ApiResponse> {
    try {
      const userId = this.ctx.state.user.userId;
      const reconciliation =
        await this.reconciliationService.handleDifference(
          id,
          body.action,
          body.reason,
          userId
        );

      return {
        success: true,
        message: '差异处理成功',
        data: reconciliation,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '差异处理失败',
        code: 400,
      };
    }
  }

  /**
   * 审批对账记录
   * PUT /api/v1/reconciliations/:id/approve
   */
  @Put('/:id/approve')
  @Validate()
  async approveReconciliation(
    @Param('id') id: number,
    @Body() body: { approved: boolean; notes?: string }
  ): Promise<ApiResponse> {
    try {
      const userId = this.ctx.state.user.userId;
      const reconciliation =
        await this.reconciliationService.approveReconciliation(
          id,
          body.approved,
          userId,
          body.notes
        );

      return {
        success: true,
        message: body.approved ? '审批通过' : '审批拒绝',
        data: reconciliation,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '审批失败',
        code: 400,
      };
    }
  }

  /**
   * 获取对账统计数据
   * GET /api/v1/reconciliations/stats/summary
   */
  @Get('/stats/summary')
  async getReconciliationStats(): Promise<ApiResponse> {
    try {
      const stats = await this.reconciliationService.getReconciliationStats();

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取统计数据失败',
        code: 500,
      };
    }
  }

  /**
   * 获取待对账发票列表
   * GET /api/v1/reconciliations/pending-invoices
   */
  @Get('/pending-invoices')
  async getPendingInvoices(): Promise<ApiResponse> {
    try {
      const invoices =
        await this.reconciliationService.getPendingInvoices();

      return {
        success: true,
        data: invoices,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取待对账发票失败',
        code: 500,
      };
    }
  }
}
