import {
  Controller,
  Get,
  Post,
  Put,
  Del,
  Patch,
  Body,
  Param,
  Query,
  Inject,
} from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { Validate } from '@midwayjs/validate';
import { ContractService } from '../service/contract.service';
import {
  CreateContractDto,
  UpdateContractDto,
  PaginationQuery,
  ApiResponse,
  ConfirmNonRenewalDto,
  BatchSetCategoryDto,
} from '../interface';

@Controller('/api/v1/contracts')
export class ContractController {
  @Inject()
  contractService: ContractService;

  @Inject()
  ctx: Context;

  /**
   * 创建合同
   */
  @Post('/')
  @Validate()
  async createContract(
    @Body() createContractDto: CreateContractDto
  ): Promise<ApiResponse> {
    try {
      const userId = this.ctx.state?.user?.id || 1;

      // 优先使用客户的 kit_id，如果没有则使用当前用户的 kit_id
      let kitId = this.ctx.state?.kitId;

      // 如果提供了 customer_id，获取客户的 kit_id
      if (createContractDto.customer_id) {
        const customer = await this.contractService.getCustomerById(
          createContractDto.customer_id
        );
        if (customer && customer.kit_id) {
          kitId = customer.kit_id;
        }
      }

      if (!kitId) {
        return {
          success: false,
          message: '请选择套装或选择有效的客户',
          code: 400,
        };
      }

      const contract = await this.contractService.createContract(
        createContractDto,
        kitId,
        userId
      );
      return {
        success: true,
        data: contract,
        message: '合同创建成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '合同创建失败',
        code: 400,
      };
    }
  }

  /**
   * 获取合同列表
   */
  @Get('/')
  async getContracts(
    @Query() query: PaginationQuery & { customerId?: number; status?: string; search?: string; viewAll?: string }
  ): Promise<ApiResponse> {
    try {
      // 如果 viewAll=true，则不传 kitId（查看全部套账）
      const kitId = query.viewAll === 'true' ? undefined : this.ctx.state?.kitId;
      const result = await this.contractService.getContracts(query, kitId);
      return {
        success: true,
        data: result,
        message: '获取合同列表成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取合同列表失败',
        code: 500,
      };
    }
  }

  /**
   * 获取可关联旧合同列表
   */
  @Get('/previous-options')
  async getPreviousContractOptions(
    @Query('customerId') customerId: number,
    @Query('currentContractId') currentContractId?: number,
    @Query('viewAll') viewAll?: string
  ): Promise<ApiResponse> {
    try {
      if (!customerId) {
        return {
          success: false,
          message: '请选择客户',
          code: 400,
        };
      }

      const kitId = viewAll === 'true' ? undefined : this.ctx.state?.kitId;
      const result = await this.contractService.getPreviousContractOptions(
        Number(customerId),
        currentContractId ? Number(currentContractId) : undefined,
        kitId
      );
      return {
        success: true,
        data: result,
        message: '获取可关联旧合同列表成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取可关联旧合同列表失败',
        code: 500,
      };
    }
  }

  /**
   * 根据ID获取合同详情
   */
  @Get('/:id')
  async getContractById(
    @Param('id') id: number,
    @Query('viewAll') viewAll?: string
  ): Promise<ApiResponse> {
    try {
      const kitId = viewAll === 'true' ? undefined : this.ctx.state?.kitId;
      const contract = await this.contractService.getContractById(id, kitId);
      if (!contract) {
        return {
          success: false,
          message: '合同不存在',
          code: 404,
        };
      }
      return {
        success: true,
        data: contract,
        message: '获取合同详情成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取合同详情失败',
        code: 500,
      };
    }
  }

  /**
   * 更新合同信息
   */
  @Put('/:id')
  @Validate()
  async updateContract(
    @Param('id') id: number,
    @Body() updateContractDto: UpdateContractDto,
    @Query('viewAll') viewAll?: string
  ): Promise<ApiResponse> {
    try {
      const kitId = viewAll === 'true' ? undefined : this.ctx.state?.kitId;
      const contract = await this.contractService.updateContract(
        id,
        updateContractDto,
        kitId
      );
      if (!contract) {
        return {
          success: false,
          message: '合同不存在',
          code: 404,
        };
      }
      return {
        success: true,
        data: contract,
        message: '合同信息更新成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '合同信息更新失败',
        code: 400,
      };
    }
  }

  /**
   * 删除合同
   */
  @Del('/:id')
  async deleteContract(
    @Param('id') id: number,
    @Query('viewAll') viewAll?: string
  ): Promise<ApiResponse> {
    try {
      const kitId = viewAll === 'true' ? undefined : this.ctx.state?.kitId;
      const success = await this.contractService.deleteContract(id, kitId);
      if (!success) {
        return {
          success: false,
          message: '合同不存在',
          code: 404,
        };
      }
      return {
        success: true,
        message: '合同删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '合同删除失败',
        code: 400,
      };
    }
  }

  /**
   * 获取合同统计信息
   */
  @Get('/stats/overview')
  async getContractStats(): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      const stats = await this.contractService.getContractStats(undefined, kitId);
      return {
        success: true,
        data: stats,
        message: '获取合同统计成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取合同统计失败',
        code: 500,
      };
    }
  }

  /**
   * 确认不续签：合同状态变为 expired_non_renewed
   */
  @Post('/:id/non-renew')
  async confirmNonRenewal(
    @Param('id') id: number,
    @Body() dto: ConfirmNonRenewalDto
  ): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      const userId = this.ctx.state?.user?.id || 1;

      if (!dto?.reason) {
        return {
          success: false,
          message: '请提供不续签原因',
          code: 400,
        };
      }

      const result = await this.contractService.confirmNonRenewal(id, dto, kitId, userId);
      return {
        success: true,
        data: result,
        message: '已确认不续签',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '确认不续签失败',
        code: 400,
      };
    }
  }

  /**
   * 确认续签：记录续签确认时间
   */
  @Post('/:id/renew')
  async confirmRenewal(
    @Param('id') id: number
  ): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      const userId = this.ctx.state?.user?.id || 1;

      const result = await this.contractService.confirmRenewal(id, kitId, userId);
      return {
        success: true,
        data: result,
        message: '已确认续签',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '确认续签失败',
        code: 400,
      };
    }
  }

  /**
   * 批量设置业务分类
   */
  @Patch('/batch-category')
  async batchSetCategory(
    @Body() dto: BatchSetCategoryDto
  ): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      if (!kitId) {
        return {
          success: false,
          message: '请选择套账',
          code: 400,
        };
      }

      if (!dto?.ids || dto.ids.length === 0) {
        return {
          success: false,
          message: '请选择要操作的合同',
          code: 400,
        };
      }

      const result = await this.contractService.batchSetCategory(
        dto.ids,
        dto.category_id,
        kitId
      );
      return {
        success: true,
        data: result,
        message: `已更新 ${result.updated} 个合同`,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '批量设置分类失败',
        code: 500,
      };
    }
  }
}
