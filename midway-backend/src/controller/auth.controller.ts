import { Controller, Post, Body, Inject } from '@midwayjs/core';
import { Validate } from '@midwayjs/validate';
import { AuthService } from '../service/auth.service';
import { LoginDto, RegisterDto, ApiResponse } from '../interface';

@Controller('/api/v1/auth')
export class AuthController {
  @Inject()
  authService: AuthService;

  /**
   * 用户登录
   */
  @Post('/login')
  @Validate()
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse> {
    try {
      const result = await this.authService.login(loginDto);
      return {
        success: true,
        data: result,
        message: '登录成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '登录失败',
        code: 401
      };
    }
  }

  /**
   * 用户注册
   */
  @Post('/register')
  @Validate()
  async register(@Body() registerDto: RegisterDto): Promise<ApiResponse> {
    try {
      const user = await this.authService.register(registerDto);
      return {
        success: true,
        data: user,
        message: '注册成功'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '注册失败',
        code: 400
      };
    }
  }

  /**
   * 刷新Token
   */
  @Post('/refresh')
  async refreshToken(@Body('token') token: string): Promise<ApiResponse> {
    try {
      const decoded = await this.authService.verifyToken(token);
      const user = await this.authService.getUserById(decoded.id);
      
      if (!user) {
        return {
          success: false,
          message: '用户不存在',
          code: 404
        };
      }

      // 生成新的token
      const newResult = await this.authService.login({
        username: user.username,
        password: '' // 这里需要优化，不应该重新验证密码
      });

      return {
        success: true,
        data: newResult,
        message: 'Token刷新成功'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Token无效',
        code: 401
      };
    }
  }
}
