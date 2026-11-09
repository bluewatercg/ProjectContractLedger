import * as fs from 'fs';
import { AttachmentController } from '../../src/controller/attachment.controller';

describe('AttachmentController attachment authorization', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function setup(access: boolean) {
    const controller = new AttachmentController() as any;
    const attachment = {
      attachment_id: 4,
      file_name: 'contract.pdf',
      file_path: '/app/uploads/contracts/3/contract.pdf',
      file_type: '.pdf',
    };
    controller.ctx = {
      state: { user: { id: 12 } },
      status: 200,
      set: jest.fn(),
    };
    controller.kitService = {
      checkUserKitAccess: jest.fn().mockResolvedValue(access),
    };
    controller.contractAttachmentService = {
      getAttachmentWithKit: jest.fn().mockResolvedValue({
        attachment,
        kitId: 2,
      }),
    };
    controller.invoiceAttachmentService = {
      getAttachmentWithKit: jest.fn().mockResolvedValue(null),
    };
    return { controller, attachment, kitService: controller.kitService };
  }

  it('allows an authorized user to preview an attachment from another selected kit', async () => {
    const { controller } = setup(true);
    const stream = {} as fs.ReadStream;
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'createReadStream').mockReturnValue(stream);

    await controller.servePublicAttachment(4, 'contract');

    expect(controller.kitService.checkUserKitAccess).toHaveBeenCalledWith(12, 2);
    expect(controller.ctx.body).toBe(stream);
  });

  it('rejects invalid attachment type before selecting a table', async () => {
    const { controller, kitService } = setup(true);

    await controller.servePublicAttachment(4, 'other' as any);

    expect(controller.ctx.status).toBe(400);
    expect(kitService.checkUserKitAccess).not.toHaveBeenCalled();
  });

  it('does not preview an attachment from an unauthorized kit', async () => {
    const { controller } = setup(false);
    const createReadStream = jest.spyOn(fs, 'createReadStream');

    await controller.servePublicAttachment(4, 'contract');

    expect(controller.ctx.status).toBe(404);
    expect(createReadStream).not.toHaveBeenCalled();
  });
});
