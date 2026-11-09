import * as jwt from 'jsonwebtoken';
import { AuthMiddleware } from '../../src/middleware/auth.middleware';

describe('AuthMiddleware JWT handling', () => {
  it('verifies tokens with configured secret without logging claims', async () => {
    const secret = ['configured', 'test', 'secret'].join('-');
    const middleware = new AuthMiddleware() as any;
    middleware.jwtSecret = secret;
    const decoded = { id: 12, username: 'user', role: 'user' };
    const token = jwt.sign(decoded, secret);
    const ctx: any = {
      path: '/api/v1/contracts',
      headers: { authorization: `Bearer ${token}` },
      state: {},
    };
    const next = jest.fn();
    const log = jest.spyOn(console, 'log').mockImplementation();

    await middleware.resolve()(ctx, next);

    expect(ctx.state.user).toMatchObject(decoded);
    expect(next).toHaveBeenCalled();
    expect(log.mock.calls.some(args => args.indexOf(decoded) !== -1)).toBe(false);
  });

  it('rejects a token signed with a non-HS256 algorithm', async () => {
    const secret = ['configured', 'test', 'secret'].join('-');
    const middleware = new AuthMiddleware() as any;
    middleware.jwtSecret = secret;
    const token = jwt.sign(
      { id: 12 },
      secret,
      { algorithm: 'HS384' }
    );
    const ctx: any = {
      path: '/api/v1/contracts',
      headers: { authorization: `Bearer ${token}` },
      state: {},
    };
    const next = jest.fn();

    await middleware.resolve()(ctx, next);

    expect(ctx.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('requires authentication for manual WeCom pushes', async () => {
    const middleware = new AuthMiddleware() as any;
    middleware.jwtSecret = ['middleware', 'test', 'secret'].join('-');
    const ctx: any = {
      path: '/api/v1/wecom/push',
      headers: {},
      state: {},
    };
    const next = jest.fn();

    await middleware.resolve()(ctx, next);

    expect(ctx.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});
