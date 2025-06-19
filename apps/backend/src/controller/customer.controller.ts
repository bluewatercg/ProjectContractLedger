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
import { CustomerService } from '../service/customer.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  PaginationQuery,
  ApiResponse,
} from '../interface';

@ApiTags(['客户管理'])
@Controller('/api/v1/customers')
export class CustomerController {
  @Inject()
  customerService: CustomerService;

  /**
   * 创建客户
   */
  @Post('/')
  @ApiOperation({
    summary: '创建客户',
    description: '创建新的客户记录'
  })
  @ApiBody({
    description: '客户创建信息',
    type: CreateCustomerDto
  })
  @ApiCreatedResponse({
    description: '客户创建成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        message: { type: 'string', example: '客户创建成功' }
      }
    }
  })
  @ApiBadRequestResponse({
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '客户创建失败' },
        code: { type: 'number', example: 400 }
      }
    }
  })
  @Validate()
  async createCustomer(
    @Body() createCustomerDto: CreateCustomerDto
  ): Promise<ApiResponse> {
    try {
      const customer = await this.customerService.createCustomer(
        createCustomerDto
      );
      return {
        success: true,
        data: customer,
        message: '客户创建成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '客户创建失败',
        code: 400,
      };
    }
  }

  /**
   * 获取客户列表
   */
  @Get('/')
  @ApiOperation({
    summary: '获取客户列表',
    description: '分页获取客户列表，支持搜索'
  })
  @ApiQuery({
    name: 'page',
    description: '页码',
    required: false,
    type: 'integer',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: '每页数量',
    required: false,
    type: 'integer',
    example: 10
  })
  @ApiQuery({
    name: 'search',
    description: '搜索关键词（客户名称）',
    required: false,
    type: 'string',
    example: '阿里巴巴'
  })
  @ApiQuery({
    name: 'sortBy',
    description: '排序字段',
    required: false,
    type: 'string',
    example: 'created_at'
  })
  @ApiQuery({
    name: 'sortOrder',
    description: '排序方向',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC'
  })
  @ApiOkResponse({
    description: '获取客户列表成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { type: 'object' } },
            total: { type: 'integer', example: 100 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 10 }
          }
        },
        message: { type: 'string', example: '获取客户列表成功' }
      }
    }
  })
  async getCustomers(
    @Query() query: PaginationQuery & { search?: string }
  ): Promise<ApiResponse> {
    try {
      const result = await this.customerService.getCustomers(query);
      return {
        success: true,
        data: result,
        message: '获取客户列表成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取客户列表失败',
        code: 500,
      };
    }
  }

  /**
   * 根据ID获取客户详情
   */
  @Get('/:id')
  @ApiOperation({
    summary: '获取客户详情',
    description: '根据客户ID获取客户详细信息'
  })
  @ApiParam({
    name: 'id',
    description: '客户ID',
    type: 'integer',
    example: 1
  })
  @ApiOkResponse({
    description: '获取客户详情成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        message: { type: 'string', example: '获取客户详情成功' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: '客户不存在',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '客户不存在' },
        code: { type: 'number', example: 404 }
      }
    }
  })
  async getCustomerById(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const customer = await this.customerService.getCustomerById(id);
      if (!customer) {
        return {
          success: false,
          message: '客户不存在',
          code: 404,
        };
      }
      return {
        success: true,
        data: customer,
        message: '获取客户详情成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取客户详情失败',
        code: 500,
      };
    }
  }

  /**
   * 更新客户信息
   */
  @Put('/:id')
  @ApiOperation({
    summary: '更新客户信息',
    description: '根据客户ID更新客户信息'
  })
  @ApiParam({
    name: 'id',
    description: '客户ID',
    type: 'integer',
    example: 1
  })
  @ApiBody({
    description: '客户更新信息',
    type: UpdateCustomerDto
  })
  @ApiOkResponse({
    description: '客户信息更新成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        message: { type: 'string', example: '客户信息更新成功' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: '客户不存在',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '客户不存在' },
        code: { type: 'number', example: 404 }
      }
    }
  })
  @ApiBadRequestResponse({
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '客户信息更新失败' },
        code: { type: 'number', example: 400 }
      }
    }
  })
  @Validate()
  async updateCustomer(
    @Param('id') id: number,
    @Body() updateCustomerDto: UpdateCustomerDto
  ): Promise<ApiResponse> {
    try {
      const customer = await this.customerService.updateCustomer(
        id,
        updateCustomerDto
      );
      if (!customer) {
        return {
          success: false,
          message: '客户不存在',
          code: 404,
        };
      }
      return {
        success: true,
        data: customer,
        message: '客户信息更新成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '客户信息更新失败',
        code: 400,
      };
    }
  }

  /**
   * 删除客户
   */
  @Del('/:id')
  @ApiOperation({
    summary: '删除客户',
    description: '根据客户ID删除客户记录'
  })
  @ApiParam({
    name: 'id',
    description: '客户ID',
    type: 'integer',
    example: 1
  })
  @ApiOkResponse({
    description: '客户删除成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '客户删除成功' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: '客户不存在',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '客户不存在' },
        code: { type: 'number', example: 404 }
      }
    }
  })
  @ApiBadRequestResponse({
    description: '删除失败',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '客户删除失败' },
        code: { type: 'number', example: 400 }
      }
    }
  })
  async deleteCustomer(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const success = await this.customerService.deleteCustomer(id);
      if (!success) {
        return {
          success: false,
          message: '客户不存在',
          code: 404,
        };
      }
      return {
        success: true,
        message: '客户删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '客户删除失败',
        code: 400,
      };
    }
  }

  /**
   * 根据状态获取客户列表
   */
  @Get('/status/:status')
  @ApiOperation({
    summary: '根据状态获取客户列表',
    description: '根据客户状态筛选客户列表'
  })
  @ApiParam({
    name: 'status',
    description: '客户状态',
    enum: ['active', 'inactive', 'suspended'],
    example: 'active'
  })
  @ApiOkResponse({
    description: '获取客户列表成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'array', items: { type: 'object' } },
        message: { type: 'string', example: '获取客户列表成功' }
      }
    }
  })
  async getCustomersByStatus(
    @Param('status') status: string
  ): Promise<ApiResponse> {
    try {
      const customers = await this.customerService.getCustomersByStatus(status);
      return {
        success: true,
        data: customers,
        message: '获取客户列表成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取客户列表失败',
        code: 500,
      };
    }
  }
}
