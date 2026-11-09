import { KitMiddleware } from '../../src/middleware/kit.middleware';

function setup(
  user: { id: number } | undefined,
  kitId = '7',
  path = '/api/v1/contracts'
) {
  const next = jest.fn();
  const kitService = {
    checkUserKitAccess: jest.fn().mockResolvedValue(true),
    getUserDefaultKit: jest.fn().mockResolvedValue(null),
  };
  const ctx: any = {
    path,
    state: user ? { user } : {},
    headers: {},
    status: 200,
    get: jest.fn().mockReturnValue(kitId),
    requestContext: { getAsync: jest.fn().mockResolvedValue(kitService) },
  };
  return { middleware: new KitMiddleware(), ctx, kitService, next };
}

describe('KitMiddleware', () => {
  it('rejects a kit header when request has no authenticated user', async () => {
    const { middleware, ctx, next } = setup(undefined);

    await middleware.resolve()(ctx, next);

    expect(ctx.status).toBe(401);
    expect(ctx.body).toMatchObject({ success: false });
    expect(ctx.state.kitId).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });

  it('sets kit context only after checking authenticated user access', async () => {
    const { middleware, ctx, kitService, next } = setup({ id: 12 });

    await middleware.resolve()(ctx, next);

    expect(kitService.checkUserKitAccess).toHaveBeenCalledWith(12, 7);
    expect(ctx.state.kitId).toBe(7);
    expect(next).toHaveBeenCalled();
  });

  it('checks kit access for manual WeCom pushes', async () => {
    const { middleware, ctx, kitService, next } = setup(
      { id: 12 },
      '7',
      '/api/v1/wecom/push'
    );

    await middleware.resolve()(ctx, next);

    expect(kitService.checkUserKitAccess).toHaveBeenCalledWith(12, 7);
    expect(ctx.state.kitId).toBe(7);
    expect(next).toHaveBeenCalled();
  });

  it('rejects a non-numeric kit header instead of falling back to default kit', async () => {
    const { middleware, ctx, next } = setup({ id: 12 }, 'not-a-kit');

    await middleware.resolve()(ctx, next);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toMatchObject({ success: false });
    expect(ctx.state.kitId).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });
});
