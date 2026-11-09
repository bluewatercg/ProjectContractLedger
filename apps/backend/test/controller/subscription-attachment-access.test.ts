import * as fs from 'fs';
import { SubscriptionController } from '../../src/controller/subscription.controller';

describe('SubscriptionController renewal attachment access', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows preview when user has access to attachment owner kit', async () => {
    const controller = new SubscriptionController() as any;
    const attachment = {
      attachment_id: 9,
      kit_id: 2,
      file_path: '/app/uploads/subscriptions/4/invoice/renewal.pdf',
      file_name: 'renewal.pdf',
      file_type: '.pdf',
    };
    const stream = {} as fs.ReadStream;
    controller.ctx = {
      state: { user: { id: 12 }, kitId: 1 },
      set: jest.fn(),
      status: 200,
    };
    controller.kitService = {
      checkUserKitAccess: jest.fn().mockResolvedValue(true),
    };
    controller.subscriptionRenewalAttachmentService = {
      getAttachmentWithKit: jest.fn().mockResolvedValue({ attachment, kitId: 2 }),
    };
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'createReadStream').mockReturnValue(stream);

    await controller.previewRenewalAttachment(9);

    expect(controller.kitService.checkUserKitAccess).toHaveBeenCalledWith(12, 2);
    expect(controller.ctx.body).toBe(stream);
  });

  it('rejects preview when user lacks access to attachment owner kit', async () => {
    const controller = new SubscriptionController() as any;
    controller.ctx = {
      state: { user: { id: 12 }, kitId: 1 },
      status: 200,
    };
    controller.kitService = {
      checkUserKitAccess: jest.fn().mockResolvedValue(false),
    };
    controller.subscriptionRenewalAttachmentService = {
      getAttachmentWithKit: jest.fn().mockResolvedValue({
        attachment: { kit_id: 2 },
        kitId: 2,
      }),
    };
    const createReadStream = jest.spyOn(fs, 'createReadStream');

    await controller.previewRenewalAttachment(9);

    expect(controller.ctx.status).toBe(404);
    expect(createReadStream).not.toHaveBeenCalled();
  });
});
