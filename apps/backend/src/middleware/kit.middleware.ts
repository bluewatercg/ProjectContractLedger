import { Middleware, IMiddleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { KitService } from '../service/kit.service';

@Middleware()
export class KitMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const skipPaths = ['/api/v1/auth', '/api/v1/kits', '/health', '/swagger'];
      if (skipPaths.some(path => ctx.path.startsWith(path))) {
        await next();
        return;
      }

      const kitService = await ctx.requestContext.getAsync(KitService);
      const kitIdHeader = ctx.get('X-Kit-Id');

      if (kitIdHeader) {
        if (!/^\d+$/.test(kitIdHeader)) {
          ctx.status = 400;
          ctx.body = {
            success: false,
            message: 'X-Kit-Id 必须是正整数',
          };
          return;
        }

        const kitId = Number(kitIdHeader);
        if (!Number.isSafeInteger(kitId) || kitId <= 0) {
          ctx.status = 400;
          ctx.body = {
            success: false,
            message: 'X-Kit-Id 必须是正整数',
          };
          return;
        }

        const user = ctx.state?.user;
        if (!user?.id) {
          ctx.status = 401;
          ctx.body = {
            success: false,
            message: '请先登录',
          };
          return;
        }

        const hasAccess = await kitService.checkUserKitAccess(user.id, kitId);
        if (!hasAccess) {
          ctx.status = 403;
          ctx.body = {
            success: false,
            message: '您没有访问该套装的权限',
          };
          return;
        }

        ctx.state.kitId = kitId;
      }

      if (!ctx.state.kitId && ctx.state?.user?.id) {
        const defaultKit = await kitService.getUserDefaultKit(
          ctx.state.user.id
        );
        if (defaultKit) ctx.state.kitId = defaultKit.id;
      }

      await next();
    };
  }

  static getName(): string {
    return 'kit';
  }
}
