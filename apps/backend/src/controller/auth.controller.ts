import { Controller, Post, Body, Inject } from '@midwayjs/decorator';
import { Validate } from '@midwayjs/validate';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@midwayjs/swagger';
import { AuthService } from '../service/auth.service';
import { LoginDto, RegisterDto, ApiResponse } from '../interface';

@ApiTags(['用户认证'])
@Controller('/api/v1/auth')
export class AuthController {
  @Inject()
  authService: AuthService;

  /**
   * 用户登录
   */
  @Post('/login')
  @ApiOperation({
    summary: '用户登录',
    description: '用户使用用户名/邮箱和密码进行登录',
  })
  @ApiBody({
    description: '登录信息',
    type: LoginDto,
  })
  @ApiOkResponse({
    description: '登录成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: { type: 'object' },
          },
        },
        message: { type: 'string', example: '登录成功' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: '登录失败',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '用户名或密码错误' },
        code: { type: 'number', example: 401 },
      },
    },
  })
  @Validate()
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse> {
    try {
      const result = await this.authService.login(loginDto);
      return {
        success: true,
        data: result,
        message: '登录成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '登录失败',
        code: 401,
      };
    }
  }

  /**
   * 用户注册
   */
  @Post('/register')
  @ApiOperation({
    summary: '用户注册',
    description: '创建新用户账户',
  })
  @ApiBody({
    description: '注册信息',
    type: RegisterDto,
  })
  @ApiCreatedResponse({
    description: '注册成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        message: { type: 'string', example: '注册成功' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '注册失败',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '用户名已存在或邮箱已被使用' },
        code: { type: 'number', example: 400 },
      },
    },
  })
  @Validate()
  async register(@Body() registerDto: RegisterDto): Promise<ApiResponse> {
    try {
      const user = await this.authService.register(registerDto);
      return {
        success: true,
        data: user,
        message: '注册成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '注册失败',
        code: 400,
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
          code: 404,
        };
      }

      // 生成新的token
      const newResult = await this.authService.login({
        username: user.username,
        password: '', // 这里需要优化，不应该重新验证密码
      });

      return {
        success: true,
        data: newResult,
        message: 'Token刷新成功',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Token无效',
        code: 401,
      };
    }
  }
}
