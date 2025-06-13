import { Catch } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

@Catch()
export class DefaultErrorFilter {
  async catch(err: Error, ctx: Context) {
    // 记录错误日志
    ctx.logger.error('Unhandled error:', err);

    // 根据错误类型返回不同的响应
    let status = 500;
    let message = '服务器内部错误';
    let code = 500;

    // 处理验证错误
    if (err.name === 'ValidationError') {
      status = 400;
      message = '请求参数验证失败';
      code = 400;
    }

    // 处理数据库错误
    if (err.name === 'QueryFailedError') {
      status = 500;
      message = '数据库操作失败';
      code = 500;
    }

    // 处理JWT错误
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      status = 401;
      message = 'token无效或已过期';
      code = 401;
    }

    // 处理业务逻辑错误
    if (err.message && err.message.includes('不存在')) {
      status = 404;
      message = err.message;
      code = 404;
    }

    ctx.status = status;
    ctx.body = {
      success: false,
      message: process.env.NODE_ENV === 'production' ? message : err.message,
      code,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    };
  }
}
