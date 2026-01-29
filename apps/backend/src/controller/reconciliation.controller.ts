import { Controller, Post, Get, Put, Inject, Query, Body, Param } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { ReconciliationService } from '../service/reconciliation.service';
import { Validate } from '@midwayjs/validate';

@Controller('/api/reconciliations')
export class ReconciliationController {
  @Inject()
  reconciliationService: ReconciliationService;

  @Inject()
  ctx: Context;

  /**
   * 自动对账 - 单张发票
   * POST /api/reconciliations/auto/:invoiceId
   */
  @Post('/auto/:invoiceId')
  async autoReconcile(@Param('invoiceId') invoiceId: number) {
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
      };
    }
  }

  /**
   * 批量自动对账
   * POST /api/reconciliations/batch-auto
   */
  @Post('/batch-auto')
  @Validate()
  async batchAutoReconcile(@Body() body: { invoiceIds: number[] }) {
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
      };
    }
  }

  /**
   * 手动对账
   * POST /api/reconciliations/manual
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
  ) {
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
      };
    }
  }

  /**
   * 获取对账列表
   * GET /api/reconciliations
   */
  @Get('/')
  async getReconciliations(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: string,
    @Query('approvalStatus') approvalStatus?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
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
      };
    }
  }

  /**
   * 获取对账详情
   * GET /api/reconciliations/:id
   */
  @Get('/:id')
  async getReconciliationById(@Param('id') id: number) {
    try {
      const reconciliation =
        await this.reconciliationService.getReconciliationById(id);

      return {
        success: true,
        data: reconciliation,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取对账详情失败',
      };
    }
  }

  /**
   * 处理对账差异
   * PUT /api/reconciliations/:id/handle-difference
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
  ) {
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
      };
    }
  }

  /**
   * 审批对账记录
   * PUT /api/reconciliations/:id/approve
   */
  @Put('/:id/approve')
  @Validate()
  async approveReconciliation(
    @Param('id') id: number,
    @Body() body: { approved: boolean; notes?: string }
  ) {
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
      };
    }
  }

  /**
   * 获取对账统计数据
   * GET /api/reconciliations/stats/summary
   */
  @Get('/stats/summary')
  async getReconciliationStats() {
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
      };
    }
  }

  /**
   * 获取待对账发票列表
   * GET /api/reconciliations/pending-invoices
   */
  @Get('/pending-invoices')
  async getPendingInvoices() {
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
      };
    }
  }
}
