import { Middleware, IMiddleware } from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';

@Middleware()
export class CorsMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const origin = ctx.headers.origin;

      // 动态CORS配置 - 适用于局域网IP部署
      if (origin) {
        let allowOrigin = false;

        try {
          const originUrl = new URL(origin);
          const originHost = originUrl.hostname;

          // 1. 开发环境：允许localhost和127.0.0.1
          if (process.env.NODE_ENV !== 'production') {
            if (originHost === 'localhost' || originHost === '127.0.0.1') {
              allowOrigin = true;
            }
          }

          // 2. 检查环境变量配置的CORS_ORIGINS
          const corsOrigins = process.env.CORS_ORIGINS;
          if (corsOrigins) {
            if (corsOrigins === '*') {
              allowOrigin = true;
            } else {
              const allowedOrigins = corsOrigins.split(',').map(o => o.trim());
              if (allowedOrigins.includes(origin)) {
                allowOrigin = true;
              }
            }
          } else {
            // 3. 默认策略：允许局域网IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
            const isPrivateIP = (
              originHost.startsWith('192.168.') ||
              originHost.startsWith('10.') ||
              /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(originHost) ||
              originHost === 'localhost' ||
              originHost === '127.0.0.1'
            );

            if (isPrivateIP) {
              allowOrigin = true;
            }
          }

          if (allowOrigin) {
            ctx.set('Access-Control-Allow-Origin', origin);
          }
        } catch (error) {
          // 如果URL解析失败，记录错误但不阻止请求
          console.warn('CORS: Invalid origin URL:', origin);
        }
      }

      ctx.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
      );
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
