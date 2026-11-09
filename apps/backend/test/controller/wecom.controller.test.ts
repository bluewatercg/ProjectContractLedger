import { WecomController } from '../../src/controller/wecom.controller';

describe('WecomController manual push', () => {
  it('uses the authenticated kit context instead of query kitId', async () => {
    const controller = new WecomController() as any;
    controller.ctx = { state: { kitId: 2 } };
    controller.wecomService = {
      triggerPush: jest.fn().mockResolvedValue({
        success: true,
        message: '推送成功',
      }),
    };

    const result = await (controller.triggerPush as any)(999);

    expect(controller.wecomService.triggerPush).toHaveBeenCalledWith(2);
    expect(result).toMatchObject({ success: true });
  });

  it('rejects a push when kit context is missing', async () => {
    const controller = new WecomController() as any;
    controller.ctx = { state: {} };
    controller.wecomService = {
      triggerPush: jest.fn(),
    };

    const result = await controller.triggerPush();

    expect(result).toMatchObject({ success: false, code: 400 });
    expect(controller.wecomService.triggerPush).not.toHaveBeenCalled();
  });
});
