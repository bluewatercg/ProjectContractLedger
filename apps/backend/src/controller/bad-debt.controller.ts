import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Inject,
} from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { BadDebtService } from '../service/bad-debt.service';
import { MarkBadDebtDto, ApiResponse } from '../interface';

@Controller('/api/v1/bad-debt')
export class BadDebtController {
  @Inject()
  badDebtService: BadDebtService;

  @Inject()
  ctx: Context;

  /**
   * 标记发票为坏账
   */
  @Post('/')
  async markAsBadDebt(@Body() dto: MarkBadDebtDto): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      const userId = this.ctx.state?.user?.id || 1;

      const result = await this.badDebtService.markInvoiceAsBadDebt(
        dto.invoice_id,
        dto,
        kitId,
        userId
      );

      return {
        success: true,
        data: result,
        message: '已标记为坏账',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '标记坏账失败',
        code: 400,
      };
    }
  }

  /**
   * 撤销坏账
   */
  @Post('/:invoiceId/undo')
  async undoBadDebt(@Param('invoiceId') invoiceId: number): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      const userId = this.ctx.state?.user?.id || 1;

      const result = await this.badDebtService.undoBadDebt(invoiceId, kitId, userId);
      return {
        success: true,
        data: result,
        message: '已撤销坏账',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '撤销坏账失败',
        code: 400,
      };
    }
  }

  /**
   * 查询发票坏账信息
   */
  @Get('/:invoiceId')
  async getBadDebtInfo(
    @Param('invoiceId') invoiceId: number
  ): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      const info = await this.badDebtService.getInvoiceBadDebtInfo(invoiceId, kitId);

      if (!info) {
        return {
          success: true,
          data: null,
          message: '该发票未标记坏账',
        };
      }

      return {
        success: true,
        data: info,
        message: '获取坏账信息成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取坏账信息失败',
        code: 500,
      };
    }
  }

  /**
   * 获取坏账统计
   */
  @Get('/stats')
  async getBadDebtStats(
    @Query('year') year?: number
  ): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      const stats = await this.badDebtService.getBadDebtStats(kitId, year ? Number(year) : undefined);
      return {
        success: true,
        data: stats,
        message: '获取坏账统计成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取坏账统计失败',
        code: 500,
      };
    }
  }
}
