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
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@midwayjs/swagger';
import { BusinessCategoryService } from '../service/business-category.service';
import {
  CreateBusinessCategoryDto,
  UpdateBusinessCategoryDto,
  MoveNodeDto,
  ApiResponse,
} from '../interface';

@ApiTags(['业务类型管理'])
@Controller('/api/v1/business-categories')
export class BusinessCategoryController {
  @Inject()
  businessCategoryService: BusinessCategoryService;

  @Inject()
  ctx: Context;

  /**
   * 获取业务类型树
   */
  @Get('/')
  @ApiOperation({
    summary: '获取业务类型树',
    description: '获取当前套账的完整业务类型树结构',
  })
  @ApiQuery({
    name: 'status',
    description: '状态过滤（用于下拉框只显示启用的分类）',
    required: false,
    enum: ['active', 'disabled'],
  })
  @ApiOkResponse({
    description: '获取业务类型树成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              parent_id: { type: 'integer', nullable: true },
              sort_order: { type: 'integer' },
              status: { type: 'string', enum: ['active', 'disabled'] },
              children: { type: 'array' },
            },
          },
        },
      },
    },
  })
  async getTree(
    @Query('status') status?: 'active' | 'disabled'
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

      const tree = await this.businessCategoryService.getTree(kitId, status);
      return {
        success: true,
        data: tree,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取业务类型树失败',
        code: 500,
      };
    }
  }

  /**
   * 创建业务类型
   */
  @Post('/')
  @ApiOperation({
    summary: '创建业务类型',
    description: '创建新的业务类型分类',
  })
  @ApiBody({
    description: '业务类型创建信息',
    type: CreateBusinessCategoryDto,
  })
  @ApiCreatedResponse({
    description: '业务类型创建成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        message: { type: 'string', example: '创建成功' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '创建失败' },
        code: { type: 'number', example: 400 },
      },
    },
  })
  @Validate()
  async create(@Body() dto: CreateBusinessCategoryDto): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      const userId = this.ctx.state?.user?.id || 1;

      if (!kitId) {
        return {
          success: false,
          message: '请选择套账',
          code: 400,
        };
      }

      const category = await this.businessCategoryService.create(dto, kitId, userId);
      return {
        success: true,
        data: category,
        message: '创建成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '创建失败',
        code: 400,
      };
    }
  }

  /**
   * 更新业务类型
   */
  @Put('/:id')
  @ApiOperation({
    summary: '更新业务类型',
    description: '更新业务类型的名称或状态',
  })
  @ApiParam({
    name: 'id',
    description: '业务类型ID',
    type: 'integer',
    example: 1,
  })
  @ApiBody({
    description: '业务类型更新信息',
    type: UpdateBusinessCategoryDto,
  })
  @ApiOkResponse({
    description: '业务类型更新成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        message: { type: 'string', example: '更新成功' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: '业务类型不存在',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '分类不存在' },
        code: { type: 'number', example: 404 },
      },
    },
  })
  @Validate()
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateBusinessCategoryDto
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

      const category = await this.businessCategoryService.update(id, dto, kitId);
      return {
        success: true,
        data: category,
        message: '更新成功',
      };
    } catch (error) {
      const isNotFound = error.message?.includes('不存在');
      return {
        success: false,
        message: error.message || '更新失败',
        code: isNotFound ? 404 : 400,
      };
    }
  }

  /**
   * 删除业务类型
   */
  @Del('/:id')
  @ApiOperation({
    summary: '删除业务类型',
    description: '删除业务类型（有子分类或关联合同时无法删除）',
  })
  @ApiParam({
    name: 'id',
    description: '业务类型ID',
    type: 'integer',
    example: 1,
  })
  @ApiOkResponse({
    description: '业务类型删除成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '删除成功' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '删除失败（有子分类或关联合同）',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '该分类下有子分类，请先删除子分类' },
        code: { type: 'number', example: 400 },
        data: {
          type: 'object',
          properties: {
            contractCount: { type: 'integer', example: 5 },
          },
        },
      },
    },
  })
  async delete(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      if (!kitId) {
        return {
          success: false,
          message: '请选择套账',
          code: 400,
        };
      }

      const result = await this.businessCategoryService.delete(id, kitId);
      if (!result.success) {
        return {
          success: false,
          message: result.message,
          code: 400,
          data: result.contractCount ? { contractCount: result.contractCount } : undefined,
        };
      }

      return {
        success: true,
        message: '删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '删除失败',
        code: 500,
      };
    }
  }

  /**
   * 移动节点（拖拽排序）
   */
  @Post('/move')
  @ApiOperation({
    summary: '移动节点',
    description: '拖拽移动业务类型节点，支持同级排序和跨级移动',
  })
  @ApiBody({
    description: '节点移动信息',
    type: MoveNodeDto,
  })
  @ApiOkResponse({
    description: '节点移动成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '移动成功' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '移动失败',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '不能将节点移动到其子节点内部' },
        code: { type: 'number', example: 400 },
      },
    },
  })
  @Validate()
  async moveNode(@Body() dto: MoveNodeDto): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      if (!kitId) {
        return {
          success: false,
          message: '请选择套账',
          code: 400,
        };
      }

      await this.businessCategoryService.moveNode(
        dto.nodeId,
        dto.targetId,
        dto.dropType,
        kitId
      );
      return {
        success: true,
        message: '移动成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '移动失败',
        code: 400,
      };
    }
  }

  /**
   * 切换状态
   */
  @Patch('/:id/toggle-status')
  @ApiOperation({
    summary: '切换状态',
    description: '切换业务类型的启用/禁用状态',
  })
  @ApiParam({
    name: 'id',
    description: '业务类型ID',
    type: 'integer',
    example: 1,
  })
  @ApiOkResponse({
    description: '状态切换成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        message: { type: 'string', example: '状态切换成功' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: '业务类型不存在',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '分类不存在' },
        code: { type: 'number', example: 404 },
      },
    },
  })
  async toggleStatus(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const kitId = this.ctx.state?.kitId;
      if (!kitId) {
        return {
          success: false,
          message: '请选择套账',
          code: 400,
        };
      }

      const category = await this.businessCategoryService.toggleStatus(id, kitId);
      return {
        success: true,
        data: category,
        message: '状态切换成功',
      };
    } catch (error) {
      const isNotFound = error.message?.includes('不存在');
      return {
        success: false,
        message: error.message || '状态切换失败',
        code: isNotFound ? 404 : 400,
      };
    }
  }
}