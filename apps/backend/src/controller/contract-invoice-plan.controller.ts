import {
  Controller,
  Get,
  Post,
  Del,
  Body,
  Param,
  Query,
  Inject,
} from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { ContractInvoicePlanService } from '../service/contract-invoice-plan.service';
import { BatchSaveContractInvoicePlanDto } from '../interface.contract-invoice-plan';
import { ApiResponse } from '../interface';

@Controller('/api/v1/contracts')
export class ContractInvoicePlanController {
  @Inject()
  contractInvoicePlanService: ContractInvoicePlanService;

  @Inject()
  ctx: Context;

  /**
   * 获取合同下的开票计划列表
   */
  @Get('/:contractId/invoice-plans')
  async getPlansByContract(
    @Param('contractId') contractId: number,
    @Query('viewAll') viewAll?: string
  ): Promise<ApiResponse> {
    try {
      const kitId = viewAll === 'true' ? undefined : this.ctx.state?.kitId;
      const plans = await this.contractInvoicePlanService.getPlansByContract(
        contractId,
        kitId
      );
      return {
        success: true,
        data: plans,
        message: '获取开票计划列表成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取开票计划列表失败',
        code: 500,
      };
    }
  }

  /**
   * 批量保存合同下的开票计划（新增/更新/删除）
   */
  @Post('/:contractId/invoice-plans')
  async savePlansForContract(
    @Param('contractId') contractId: number,
    @Body() dto: BatchSaveContractInvoicePlanDto
  ): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      if (!kitId) {
        return {
          success: false,
          message: '请先选择套账',
          code: 400,
        };
      }

      await this.contractInvoicePlanService.savePlansForContract(
        contractId,
        kitId,
        dto.plans
      );

      // 返回保存后的最新列表
      const plans = await this.contractInvoicePlanService.getPlansByContract(
        contractId,
        kitId
      );
      return {
        success: true,
        data: plans,
        message: '开票计划保存成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '开票计划保存失败',
        code: 400,
      };
    }
  }

  /**
   * 删除单条开票计划
   */
  @Del('/:contractId/invoice-plans/:planId')
  async deletePlan(
    @Param('contractId') contractId: number,
    @Param('planId') planId: number,
    @Query('viewAll') viewAll?: string
  ): Promise<ApiResponse> {
    try {
      const kitId = viewAll === 'true' ? undefined : this.ctx.state?.kitId;
      const success = await this.contractInvoicePlanService.deletePlan(
        planId,
        kitId
      );
      if (!success) {
        return {
          success: false,
          message: '开票计划不存在',
          code: 404,
        };
      }
      return {
        success: true,
        message: '开票计划删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '开票计划删除失败',
        code: 400,
      };
    }
  }

  /**
   * 获取即将到期的开票计划提醒列表
   * 查询条件：planned_invoice_date - remind_days_before <= 今天 且 status != 'invoiced'
   */
  @Get('/invoice-plans/reminders')
  async getReminders(
    @Query('viewAll') viewAll?: string,
    @Query('days') days?: string
  ): Promise<ApiResponse> {
    try {
      const kitId = viewAll === 'true' ? undefined : this.ctx.state?.kitId;
      const lookAheadDays = days ? parseInt(days, 10) : undefined;
      const plans = await this.contractInvoicePlanService.getReminders(
        kitId,
        lookAheadDays
      );
      return {
        success: true,
        data: plans,
        message: '获取开票提醒列表成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取开票提醒列表失败',
        code: 500,
      };
    }
  }
}
