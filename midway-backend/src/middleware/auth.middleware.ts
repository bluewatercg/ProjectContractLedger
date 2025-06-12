import { Middleware, IMiddleware } from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';
import * as jwt from 'jsonwebtoken';

@Middleware()
export class AuthMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      // 跳过不需要认证的路由
      const skipPaths = [
        '/api/v1/auth/login',
        '/api/v1/auth/register',
        '/api/v1/auth/refresh',
        '/api-docs',
        '/',
        '/favicon.ico',
        '/health',
        '/health/simple',
        '/health/ready',
        '/health/live'
      ];

      const path = ctx.path;
      if (skipPaths.some(skipPath => path.startsWith(skipPath))) {
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
          code: 401
        };
        return;
      }

      const token = authorization.replace('Bearer ', '');
      if (!token) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          message: '无效的token格式',
          code: 401
        };
        return;
      }

      try {
        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        ctx.state.user = decoded;
        await next();
      } catch (error) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          message: 'token已过期或无效',
          code: 401
        };
        return;
      }
    };
  }

  static getName(): string {
    return 'auth';
  }
}
