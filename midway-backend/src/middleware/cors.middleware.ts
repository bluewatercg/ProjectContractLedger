import { Middleware, IMiddleware } from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';

@Middleware()
export class CorsMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      // 设置CORS头
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://192.168.1.31:8000'
      ];

      const origin = ctx.headers.origin;
      if (allowedOrigins.includes(origin)) {
        ctx.set('Access-Control-Allow-Origin', origin);
      }

      ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      ctx.set('Access-Control-Allow-Credentials', 'true');
      ctx.set('Access-Control-Max-Age', '86400');

      // 处理预检请求
      if (ctx.method === 'OPTIONS') {
        ctx.status = 200;
        return;
      }

      await next();
    };
  }

  static getName(): string {
    return 'cors';
  }
}
