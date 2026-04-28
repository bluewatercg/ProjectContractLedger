import { Controller, Get, Post, Query, Inject } from '@midwayjs/decorator';
import { WecomService } from '../service/wecom.service';
import { ApiResponse } from '../interface';

@Controller('/api/v1/wecom')
export class WecomController {
  @Inject()
  wecomService: WecomService;

  /**
   * 手动触发企业微信推送
   */
  @Post('/push')
  async triggerPush(@Query('kitId') kitId?: number): Promise<ApiResponse> {
    try {
      const result = await this.wecomService.triggerPush(kitId);
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '推送失败',
        code: 500,
      };
    }
  }

  /**
   * 获取企业微信推送配置
   */
  @Get('/config')
  async getConfig(): Promise<ApiResponse> {
    return {
      success: true,
      data: this.wecomService.getConfig(),
      message: '获取配置成功',
    };
  }
}
