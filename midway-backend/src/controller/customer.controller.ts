import { Controller, Get, Post, Put, Del, Body, Param, Query, Inject } from '@midwayjs/core';
import { Validate } from '@midwayjs/validate';
import { CustomerService } from '../service/customer.service';
import { CreateCustomerDto, UpdateCustomerDto, PaginationQuery, ApiResponse } from '../interface';

@Controller('/api/v1/customers')
export class CustomerController {
  @Inject()
  customerService: CustomerService;

  /**
   * 创建客户
   */
  @Post('/')
  @Validate()
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto): Promise<ApiResponse> {
    try {
      const customer = await this.customerService.createCustomer(createCustomerDto);
      return {
        success: true,
        data: customer,
        message: '客户创建成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '客户创建失败',
        code: 400
      };
    }
  }

  /**
   * 获取客户列表
   */
  @Get('/')
  async getCustomers(@Query() query: PaginationQuery & { search?: string }): Promise<ApiResponse> {
    try {
      const result = await this.customerService.getCustomers(query);
      return {
        success: true,
        data: result,
        message: '获取客户列表成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取客户列表失败',
        code: 500
      };
    }
  }

  /**
   * 根据ID获取客户详情
   */
  @Get('/:id')
  async getCustomerById(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const customer = await this.customerService.getCustomerById(id);
      if (!customer) {
        return {
          success: false,
          message: '客户不存在',
          code: 404
        };
      }
      return {
        success: true,
        data: customer,
        message: '获取客户详情成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取客户详情失败',
        code: 500
      };
    }
  }

  /**
   * 更新客户信息
   */
  @Put('/:id')
  @Validate()
  async updateCustomer(
    @Param('id') id: number,
    @Body() updateCustomerDto: UpdateCustomerDto
  ): Promise<ApiResponse> {
    try {
      const customer = await this.customerService.updateCustomer(id, updateCustomerDto);
      if (!customer) {
        return {
          success: false,
          message: '客户不存在',
          code: 404
        };
      }
      return {
        success: true,
        data: customer,
        message: '客户信息更新成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '客户信息更新失败',
        code: 400
      };
    }
  }

  /**
   * 删除客户
   */
  @Del('/:id')
  async deleteCustomer(@Param('id') id: number): Promise<ApiResponse> {
    try {
      const success = await this.customerService.deleteCustomer(id);
      if (!success) {
        return {
          success: false,
          message: '客户不存在',
          code: 404
        };
      }
      return {
        success: true,
        message: '客户删除成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '客户删除失败',
        code: 400
      };
    }
  }

  /**
   * 根据状态获取客户列表
   */
  @Get('/status/:status')
  async getCustomersByStatus(@Param('status') status: string): Promise<ApiResponse> {
    try {
      const customers = await this.customerService.getCustomersByStatus(status);
      return {
        success: true,
        data: customers,
        message: '获取客户列表成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取客户列表失败',
        code: 500
      };
    }
  }
}
