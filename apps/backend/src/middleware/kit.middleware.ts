import { Middleware, IMiddleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { KitService } from '../service/kit.service';

/**
 * Kit中间件 - 从请求头中提取并验证kit_id
 */
@Middleware()
export class KitMiddleware implements IMiddleware<Context, NextFunction> {
    resolve() {
        return async (ctx: Context, next: NextFunction) => {
            console.log('[KitMiddleware] START');
            console.log('[KitMiddleware] Authorization header:', ctx.headers.authorization ? 'present' : 'missing');
            console.log('[KitMiddleware] ctx.state.user BEFORE:', ctx.state?.user);

            // 跳过不需要kit验证的路由
            const skipPaths = ['/api/v1/auth', '/api/v1/kits', '/health', '/swagger'];
            const shouldSkip = skipPaths.some(path => ctx.path.startsWith(path));

            if (shouldSkip) {
                await next();
                return;
            }

            // 通过 requestContext 获取 KitService（解决作用域问题）
            const kitService = await ctx.requestContext.getAsync(KitService);

            // 从header中获取kit_id
            const kitIdHeader = ctx.get('X-Kit-Id');
            console.log('[KitMiddleware] Path:', ctx.path, 'X-Kit-Id header:', kitIdHeader, 'User:', ctx.state?.user?.id);

            if (kitIdHeader) {
                const kitId = parseInt(kitIdHeader, 10);

                if (!isNaN(kitId)) {
                    // 从JWT token中获取用户ID
                    const user = ctx.state?.user;

                    if (user?.id) {
                        // 验证用户是否有权访问该套装
                        const hasAccess = await kitService.checkUserKitAccess(user.id, kitId);
                        console.log('[KitMiddleware] User', user.id, 'access to kit', kitId, ':', hasAccess);

                        if (hasAccess) {
                            // 将kit_id存储到ctx.state供后续使用
                            ctx.state.kitId = kitId;
                        } else {
                            ctx.status = 403;
                            ctx.body = {
                                success: false,
                                message: '您没有访问该套装的权限',
                            };
                            return;
                        }
                    } else {
                        // 用户未认证，直接存储kit_id（依赖JWT中间件后续验证）
                        ctx.state.kitId = kitId;
                        console.log('[KitMiddleware] User not authenticated, setting kitId:', kitId);
                    }
                }
            }

            // 如果没有kit_id，尝试获取用户的默认套装
            if (!ctx.state.kitId && ctx.state?.user?.id) {
                const defaultKit = await kitService.getUserDefaultKit(ctx.state.user.id);
                console.log('[KitMiddleware] No kit_id, getting default for user', ctx.state.user.id, ':', defaultKit?.id);
                if (defaultKit) {
                    ctx.state.kitId = defaultKit.id;
                }
            }

            console.log('[KitMiddleware] Final kitId:', ctx.state.kitId);
            await next();
        };
    }

    static getName(): string {
        return 'kit';
    }
}

