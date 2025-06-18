import { Post, Body, Inject } from '@midwayjs/decorator';
import { Validate } from '@midwayjs/validate';
import { AuthService } from '../service/auth.service';
import { LoginDto, RegisterDto, ApiResponse } from '../interface';
import { VersionedController, createVersionedController } from './base/versioned.controller';

/**
 * 通用认证控制器示例
 * 演示如何使用版本化控制器基类
 * 可以通过修改装饰器参数支持任意版本 (v2, v3, v4, vX...)
 */
@createVersionedController('v2', '/auth')  // 修改这里可以支持任意版本
export class AuthVersionedController extends VersionedController {
  @Inject()
  authService: AuthService;

  /**
   * 用户登录 - 版本化实现
   * 根据API版本自动调整响应格式和功能
   */
  @Post('/login')
  @Validate()
  async login(@Body() loginDto: LoginDto): Promise<any> {
    try {
      // 使用现有的登录服务
      const result = await this.authService.login(loginDto);

      // 使用版本化响应格式
      const response = this.createVersionedResponse(result, '登录成功');

      // 根据版本添加额外功能
      const version = this.getApiVersion();
      if (this.compareVersions(version, 'v2') >= 0) {
        // v2及以上版本添加额外信息
        response.data.sessionInfo = {
          sessionId: `session_${Date.now()}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
      }

      if (this.compareVersions(version, 'v3') >= 0) {
        // v3及以上版本添加安全信息
        response.data.securityInfo = {
          lastLogin: new Date().toISOString(),
          loginCount: 1,
          deviceFingerprint: 'web_browser'
        };
      }

      return response;
    } catch (error) {
      return this.createVersionedResponse(
        { error: error.message },
        '登录失败',
        false
      );
    }
  }

  /**
   * 用户注册 - 版本化实现
   */
  @Post('/register')
  @Validate()
  async register(@Body() registerDto: RegisterDto): Promise<any> {
    try {
      // 使用现有的注册服务
      const user = await this.authService.register(registerDto);

      // 使用版本化响应格式
      const response = this.createVersionedResponse(user, '注册成功');

      // 根据版本添加额外功能
      const version = this.getApiVersion();
      if (this.compareVersions(version, 'v2') >= 0) {
        // v2及以上版本添加注册状态
        response.data.registrationStatus = 'completed';
        response.data.nextSteps = ['完善个人信息', '设置安全选项'];
      }

      if (this.compareVersions(version, 'v3') >= 0) {
        // v3及以上版本添加欢迎信息
        response.data.welcomeMessage = '欢迎加入我们的平台！';
        response.data.onboardingTasks = [
          { task: '上传头像', completed: false },
          { task: '验证邮箱', completed: true },
          { task: '设置双因素认证', completed: false }
        ];
      }

      return response;
    } catch (error) {
      return this.createVersionedResponse(
        { error: error.message },
        '注册失败',
        false
      );
    }
  }
}
