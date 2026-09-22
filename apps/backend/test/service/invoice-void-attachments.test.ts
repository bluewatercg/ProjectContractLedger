import { InvoiceAttachmentService } from '../../src/service/invoice-attachment.service';
import { Invoice } from '../../src/entity/invoice.entity';
import { InvoiceAttachment } from '../../src/entity/invoice-attachment.entity';

function setup(overrides: Record<string, unknown> = {}) {
  const invoice = Object.assign(
    new Invoice(),
    {
      id: 7,
      kit_id: 1,
      status: 'sent',
    },
    overrides
  );

  const attachment = Object.assign(new InvoiceAttachment(), {
    attachment_id: 100,
    invoice_id: 7,
    file_name: 'test.pdf',
    file_path: '/tmp/test.pdf',
    file_type: '.pdf',
    file_size: 1024,
    uploaded_at: new Date(),
  });

  const manager: any = {
    findOne: async (entity: any, options: any) => {
      if (entity === Invoice) {
        const where = options.where;
        if (where.id === invoice.id && where.kit_id === invoice.kit_id) {
          return invoice;
        }
        return null;
      }
      if (entity === InvoiceAttachment) {
        if (options.where.attachment_id === attachment.attachment_id) {
          return attachment;
        }
        return null;
      }
      return null;
    },
    create: (entity: any, data: any) => Object.assign(new entity(), data),
    save: async (entity: any, data: any) => data,
    remove: async () => undefined,
  };

  const service = new InvoiceAttachmentService();
  service.dataSource = { transaction: async (fn: any) => fn(manager) } as any;

  return { service, invoice, attachment, manager };
}

describe('invoice attachment void lifecycle', () => {
  it('rejects create on cancelled invoice', async () => {
    const { service } = setup({ status: 'cancelled' });
    await expect(
      service.createAttachment(
        7,
        {
          file_name: 'test.pdf',
          file_path: '/tmp/test.pdf',
          file_type: '.pdf',
          file_size: 1024,
        },
        1
      )
    ).rejects.toThrow(/已作废发票不可上传附件/);
  });

  it('rejects create on different kit', async () => {
    const { service, invoice } = setup();
    await expect(
      service.createAttachment(
        7,
        {
          file_name: 'test.pdf',
          file_path: '/tmp/test.pdf',
          file_type: '.pdf',
          file_size: 1024,
        },
        2
      )
    ).rejects.toThrow(/发票不存在/);
    expect(invoice.status).toBe('sent');
  });

  it('rejects delete on cancelled invoice', async () => {
    const { service } = setup({ status: 'cancelled' });
    await expect(service.deleteAttachment(100, 1)).rejects.toThrow(
      /已作废发票不可删除附件/
    );
  });

  it('rejects delete on different kit', async () => {
    const { service } = setup();
    await expect(service.deleteAttachment(100, 2)).rejects.toThrow(
      /发票不存在/
    );
  });

  it('allows create on non-cancelled invoice', async () => {
    const { service } = setup();
    const result = await service.createAttachment(
      7,
      {
        file_name: 'test.pdf',
        file_path: '/tmp/test.pdf',
        file_type: '.pdf',
        file_size: 1024,
      },
      1
    );
    expect(result.file_name).toBe('test.pdf');
  });

  it('allows delete on non-cancelled invoice', async () => {
    const { service } = setup();
    const result = await service.deleteAttachment(100, 1);
    expect(result.deleted).toBe(true);
    expect(result.filePath).toBe('/tmp/test.pdf');
  });

  it('returns deleted=false for non-existent attachment', async () => {
    const { service } = setup();
    const result = await service.deleteAttachment(999, 1);
    expect(result.deleted).toBe(false);
    expect(result.filePath).toBeNull();
  });

  it('rejects create without kitId', async () => {
    const { service } = setup();
    await expect(
      service.createAttachment(
        7,
        {
          file_name: 'test.pdf',
          file_path: '/tmp/test.pdf',
          file_type: '.pdf',
          file_size: 1024,
        },
        0
      )
    ).rejects.toThrow(/请登录并选择当前套账/);
  });

  it('rejects delete without kitId', async () => {
    const { service } = setup();
    await expect(service.deleteAttachment(100, 0)).rejects.toThrow(
      /请登录并选择当前套账/
    );
  });
});
