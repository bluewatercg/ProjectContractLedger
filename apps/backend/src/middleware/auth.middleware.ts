import { Middleware, IMiddleware, Config } from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';
import * as jwt from 'jsonwebtoken';

@Middleware()
export class AuthMiddleware implements IMiddleware<Context, NextFunction> {
  @Config('jwt.secret')
  jwtSecret: string;

  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const skipPaths = [
        '/api/v1/auth/login',
        '/api/v1/auth/register',
        '/api/v1/auth/refresh',
        '/api/v1/wecom/push',
        '/api/v1/wecom/config',
        '/api/v1/subscriptions/attachments/public-preview',
        '/api-docs',
        '/swagger-ui/',
        '/favicon.ico',
        '/health',
        '/health/simple',
        '/health/ready',
        '/health/live',
      ];

      const path = ctx.path;
      const matchedSkipPath = skipPaths.find(skipPath =>
        path.startsWith(skipPath)
      );
      if (matchedSkipPath) {
        await next();
        return;
      }

      // 特殊处理：精确匹配根路径
      if (path === '/') {
        await next();
        return;
      }

      // 获取token
      const authorization = ctx.headers.authorization;
      if (!authorization) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          message: '缺少认证token',
          code: 401,
        };
        return;
      }

      const token = authorization.replace('Bearer ', '');
      if (!token) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          message: '无效的token格式',
          code: 401,
        };
        return;
      }

      try {
        // 验证token
        const decoded = jwt.verify(token, this.jwtSecret);
        ctx.state.user = decoded;
        await next();
      } catch {
        ctx.status = 401;
        ctx.body = {
          success: false,
          message: 'token已过期或无效',
          code: 401,
        };
        return;
      }
    };
  }

  static getName(): string {
    return 'auth';
  }
}
