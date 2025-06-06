import { Controller, Get, Post, Put, Del, Body, Param, Query, Inject } from '@midwayjs/core';
import { Validate } from '@midwayjs/validate';
import { ContractService } from '../service/contract.service';
import { CreateContractDto, UpdateContractDto, PaginationQuery, ApiResponse } from '../interface';

@Controller('/api/v1/contracts')
export class ContractController {
  @Inject()
  contractService: ContractService;

  /**
   * 创建合同
   */
  @Post('/')
  @Validate()
  async createContract(@Body() createContractDto: CreateContractDto): Promise<ApiResponse> {
    try {
      const contract = await this.contractService.createContract(createContractDto);
      return {
        success: true,
        data: contract,
        message: '合同创建成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '合同创建失败',
        code: 400
      };
    }
  }

  /**
   * 获取合同列表
   */
  @Get('/')
  async getContracts(@Query() query: PaginationQuery & { customerId?: number; status?: string }): Promise<ApiResponse> {
    try {
      const result = await this.contractService.getContracts(query);
      return {
        success: true,
        data: result,
        message: '获取合同列表成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取合同列表失败',
        code: 500
      };
    }
  }

  /**
   * 根据ID获取合同详情
   */
  @Get('/:id')
  async getContractById(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const contract = await this.contractService.getContractById(id);
      if (!contract) {
        return {
          success: false,
          message: '合同不存在',
          code: 404
        };
      }
      return {
        success: true,
        data: contract,
        message: '获取合同详情成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取合同详情失败',
        code: 500
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
    @Body() updateContractDto: UpdateContractDto
  ): Promise<ApiResponse> {
    try {
      const contract = await this.contractService.updateContract(id, updateContractDto);
      if (!contract) {
        return {
          success: false,
          message: '合同不存在',
          code: 404
        };
      }
      return {
        success: true,
        data: contract,
        message: '合同信息更新成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '合同信息更新失败',
        code: 400
      };
    }
  }

  /**
   * 删除合同
   */
  @Del('/:id')
  async deleteContract(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const success = await this.contractService.deleteContract(id);
      if (!success) {
        return {
          success: false,
          message: '合同不存在',
          code: 404
        };
      }
      return {
        success: true,
        message: '合同删除成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '合同删除失败',
        code: 400
      };
    }
  }

  /**
   * 获取合同统计信息
   */
  @Get('/stats/overview')
  async getContractStats(): Promise<ApiResponse> {
    try {
      const stats = await this.contractService.getContractStats();
      return {
        success: true,
        data: stats,
        message: '获取合同统计成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取合同统计失败',
        code: 500
      };
    }
  }
}
