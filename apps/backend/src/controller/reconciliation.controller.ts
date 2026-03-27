import {
  Controller,
  Post,
  Get,
  Put,
  Del,
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
      const kitId = this.ctx.state?.kitId;

      if (!kitId) {
        return {
          success: false,
          message: '请选择套装',
          code: 400,
        };
      }

      const userId = this.ctx.state?.user?.id || this.ctx.state?.user?.userId;

      if (!userId) {
        return {
          success: false,
          message: '用户未认证',
          code: 401,
        };
      }

      const reconciliation = await this.reconciliationService.autoReconcile(
        invoiceId,
        userId,
        kitId
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
      console.log('[ReconciliationController] batch-auto called');
      console.log('[ReconciliationController] ctx.state:', this.ctx.state);
      console.log('[ReconciliationController] ctx.state.user:', this.ctx.state?.user);

      const kitId = this.ctx.state?.kitId;

      if (!kitId) {
        return {
          success: false,
          message: '请选择套装',
          code: 400,
        };
      }

      const userId = this.ctx.state?.user?.id || this.ctx.state?.user?.userId;
      console.log('[ReconciliationController] userId:', userId);

      if (!userId) {
        return {
          success: false,
          message: '用户未认证',
          code: 401,
        };
      }

      const result = await this.reconciliationService.batchAutoReconcile(
        body.invoiceIds,
        userId,
        kitId
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
      const kitId = this.ctx.state?.kitId;

      if (!kitId) {
        return {
          success: false,
          message: '请选择套装',
          code: 400,
        };
      }

      const userId = this.ctx.state?.user?.id || this.ctx.state?.user?.userId;

      if (!userId) {
        return {
          success: false,
          message: '用户未认证',
          code: 401,
        };
      }

      const reconciliation = await this.reconciliationService.manualReconcile({
        ...body,
        userId,
        kitId,
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
      const kitId = this.ctx.state?.kitId;

      if (!kitId) {
        return {
          success: false,
          message: '请选择套装',
          code: 400,
        };
      }

      const result = await this.reconciliationService.getReconciliations({
        page,
        pageSize,
        status,
        approvalStatus,
        startDate,
        endDate,
        kitId,
      });

      return {
        success: true,
        data: result,
        message: '获取对账列表成功',
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
      const kitId = this.ctx.state?.kitId;

      if (!kitId) {
        return {
          success: false,
          message: '请选择套装',
          code: 400,
        };
      }

      const reconciliation =
        await this.reconciliationService.getReconciliationById(id, kitId);

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
      const kitId = this.ctx.state?.kitId;

      if (!kitId) {
        return {
          success: false,
          message: '请选择套装',
          code: 400,
        };
      }

      const userId = this.ctx.state?.user?.id || this.ctx.state?.user?.userId;

      if (!userId) {
        return {
          success: false,
          message: '用户未认证',
          code: 401,
        };
      }

      const reconciliation =
        await this.reconciliationService.handleDifference(
          id,
          body.action,
          body.reason,
          userId,
          kitId
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
      const kitId = this.ctx.state?.kitId;

      if (!kitId) {
        return {
          success: false,
          message: '请选择套装',
          code: 400,
        };
      }

      const userId = this.ctx.state?.user?.id || this.ctx.state?.user?.userId;

      if (!userId) {
        return {
          success: false,
          message: '用户未认证',
          code: 401,
        };
      }

      const reconciliation =
        await this.reconciliationService.approveReconciliation(
          id,
          body.approved,
          userId,
          kitId,
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
      const kitId = this.ctx.state?.kitId;

      if (!kitId) {
        return {
          success: false,
          message: '请选择套装',
          code: 400,
        };
      }

      const stats = await this.reconciliationService.getReconciliationStats(kitId);

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
      const kitId = this.ctx.state?.kitId;

      if (!kitId) {
        return {
          success: false,
          message: '请选择套装',
          code: 400,
        };
      }

      const invoices =
        await this.reconciliationService.getPendingInvoices(kitId);

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

  /**
   * 删除对账记录
   * DELETE /api/v1/reconciliations/:id
   */
  @Del('/:id')
  async deleteReconciliation(
    @Param('id') id: number
  ): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;

      if (!kitId) {
        return {
          success: false,
          message: '请选择套装',
          code: 400,
        };
      }

      const success = await this.reconciliationService.deleteReconciliation(
        id,
        kitId
      );

      if (!success) {
        return {
          success: false,
          message: '对账记录不存在',
          code: 404,
        };
      }

      return {
        success: true,
        message: '删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '删除对账记录失败',
        code: 400,
      };
    }
  }
}
