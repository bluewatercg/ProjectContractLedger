import { Controller, Get, Post, Param, Query, Inject } from '@midwayjs/decorator';
import { ApiResponse } from '../interface';
import { ReminderService } from '../service/reminder.service';

@Controller('/api/v1/reminders')
export class ReminderController {
  @Inject()
  reminderService: ReminderService;

  /**
   * 获取所有提醒事项
   */
  @Get('/')
  async getAllReminders(): Promise<ApiResponse> {
    try {
      const reminders = await this.reminderService.getAllReminders();
      
      return {
        success: true,
        message: '获取提醒事项成功',
        data: reminders
      };
    } catch (error) {
      return {
        success: false,
        message: '获取提醒事项失败: ' + error.message,
        code: 500
      };
    }
  }

  /**
   * 获取提醒数量统计
   */
  @Get('/count')
  async getReminderCount(
    @Query('type') type?: string
  ): Promise<ApiResponse> {
    try {
      const count = await this.reminderService.getReminderCount(type);
      
      return {
        success: true,
        message: '获取提醒数量成功',
        data: { count, type: type || 'all' }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取提醒数量失败: ' + error.message,
        code: 500
      };
    }
  }

  /**
   * 标记提醒为已处理
   */
  @Post('/:id/handled')
  async markAsHandled(
    @Param('id') id: number,
    @Query('type') type: string
  ): Promise<ApiResponse> {
    try {
      const success = await this.reminderService.markReminderAsHandled(id, type);
      
      return {
        success,
        message: success ? '标记已处理成功' : '标记已处理失败',
        data: { id, type }
      };
    } catch (error) {
      return {
        success: false,
        message: '标记已处理失败: ' + error.message,
        code: 500
      };
    }
  }

  /**
   * 获取合同履约提醒（履约类）
   */
  @Get('/contract-fulfillment')
  async getContractFulfillment(): Promise<ApiResponse> {
    try {
      const fulfillmentItems = await this.reminderService.getContractFulfillmentReminders();
      
      return {
        success: true,
        message: '获取合同履约提醒成功',
        data: {
          total: fulfillmentItems.length,
          items: fulfillmentItems
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取合同履约提醒失败: ' + error.message,
        code: 500
      };
    }
  }

  /**
   * 获取开票提醒（开票类）
   */
  @Get('/invoice-needed')
  async getInvoiceNeeded(): Promise<ApiResponse> {
    try {
      const invoiceItems = await this.reminderService.getInvoiceNeededReminders();
      
      return {
        success: true,
        message: '获取开票提醒成功',
        data: {
          total: invoiceItems.length,
          items: invoiceItems
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取开票提醒失败: ' + error.message,
        code: 500
      };
    }
  }

  /**
   * 获取收款提醒（收款类）
   */
  @Get('/payment-needed')
  async getPaymentNeeded(): Promise<ApiResponse> {
    try {
      const paymentItems = await this.reminderService.getPaymentNeededReminders();
      
      return {
        success: true,
        message: '获取收款提醒成功',
        data: {
          total: paymentItems.length,
          items: paymentItems
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取收款提醒失败: ' + error.message,
        code: 500
      };
    }
  }

  /**
   * 获取合同续签提醒
   */
  @Get('/contract-renewals')
  async getContractRenewals(): Promise<ApiResponse> {
    try {
      const summary = await this.reminderService.getAllReminders();
      const renewalItems = summary.items.filter(item => item.type === 'contract_renewal');
      
      return {
        success: true,
        message: '获取合同续签提醒成功',
        data: {
          total: renewalItems.length,
          items: renewalItems
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取合同续签提醒失败: ' + error.message,
        code: 500
      };
    }
  }

  /**
   * 获取收款催办提醒（财务收款专用）
   */
  @Get('/payment-collection')
  async getPaymentCollection(): Promise<ApiResponse> {
    try {
      const summary = await this.reminderService.getAllReminders();
      const paymentItems = summary.items.filter(item => item.type === 'payment_collection');
      
      return {
        success: true,
        message: '获取收款催办提醒成功',
        data: {
          total: paymentItems.length,
          items: paymentItems
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取收款催办提醒失败: ' + error.message,
        code: 500
      };
    }
  }
}