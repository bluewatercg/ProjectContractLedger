import { DataSource, EntityManager, EntityTarget } from 'typeorm';
import { Context } from '@midwayjs/koa';
import { InvoiceService } from '../../src/service/invoice.service';
import { Invoice } from '../../src/entity/invoice.entity';
import { Payment } from '../../src/entity/payment.entity';
import { InvoiceController } from '../../src/controller/invoice.controller';

function setup(
  overrides: Partial<Invoice> = {},
  payments: Partial<Payment>[] = []
) {
  const invoice = Object.assign(
    new Invoice(),
    {
      id: 7,
      kit_id: 1,
      contract_id: 3,
      plan_id: 4,
      invoice_number: 'INV7',
      status: 'sent',
      total_amount: 30000,
      bad_debt_amount: 0,
      void_reason: null,
      voided_by: null,
      voided_at: null,
    },
    overrides
  );
  const manager = {
    findOne: async (
      entity: EntityTarget<Invoice>,
      options: { where: Partial<Invoice> }
    ) => {
      if (entity === Invoice) {
        return Object.entries(options.where).every(
          ([key, value]) => invoice[key as keyof Invoice] === value
        )
          ? invoice
          : null;
      }
      return null;
    },
    count: async (entity: EntityTarget<Payment>) =>
      entity === Payment ? payments.length : 0,
    save: async (...args: unknown[]) => args[args.length - 1],
  };
  const service = new InvoiceService();
  // The service only uses these EntityManager operations in this isolated test.
  service.dataSource = {
    transaction: async (fn: (manager: EntityManager) => Promise<unknown>) =>
      fn(manager as unknown as EntityManager),
  } as unknown as DataSource;
  service.contractInvoicePlanService = {
    recalcPlanAmountAndStatus: async () => undefined,
  };
  service.statisticsService = { invalidateInvoiceCache: () => undefined };
  return { service, invoice };
}

const voidInvoice = (
  service: InvoiceService,
  reason: unknown = '票面错误',
  kitId = 1
) => service.voidInvoice(7, reason, kitId, 9);

describe('invoice void lifecycle', () => {
  it('retains the original amount and first audit record on a repeated request', async () => {
    const { service, invoice } = setup();
    const result = await voidInvoice(service, ' 票面错误 ');
    expect(result).toMatchObject({
      status: 'cancelled',
      total_amount: 30000,
      invoice_number: 'INV7',
      void_reason: '票面错误',
      voided_by: 9,
    });
    const firstTime = invoice.voided_at;
    expect(firstTime).toBeInstanceOf(Date);
    await voidInvoice(service, '另一个原因');
    expect(invoice.void_reason).toBe('票面错误');
    expect(invoice.voided_at).toBe(firstTime);
  });

  it('rejects whitespace reasons without cancelling the invoice', async () => {
    const { service, invoice } = setup();
    await expect(voidInvoice(service, '   ')).rejects.toThrow();
    expect(invoice.status).toBe('sent');
  });

  it('cannot void a different kit invoice', async () => {
    const { service, invoice } = setup();
    expect(await voidInvoice(service, '票面错误', 2)).toBeNull();
    expect(invoice.status).toBe('sent');
  });

  it('rejects an invoice with a payment even if its status is still sent', async () => {
    const { service, invoice } = setup({}, [
      { status: 'completed', amount: 1 },
    ]);
    await expect(voidInvoice(service)).rejects.toThrow(/收款/);
    expect(invoice.status).toBe('sent');
  });

  it('rejects partial bad debt independently of invoice status', async () => {
    const { service, invoice } = setup({ bad_debt_amount: 1 });
    await expect(voidInvoice(service)).rejects.toThrow(/坏账/);
    expect(invoice.status).toBe('sent');
  });

  it('does not allow generic updates to cancel an invoice', async () => {
    const { service, invoice } = setup();
    await expect(
      service.updateInvoice(7, { status: 'cancelled' }, 1)
    ).rejects.toThrow();
    expect(invoice.status).toBe('sent');
  });

  it('does not allow generic edits to restore a cancelled invoice', async () => {
    const { service, invoice } = setup({ status: 'cancelled' });
    await expect(
      service.updateInvoice(7, { status: 'sent' }, 1)
    ).rejects.toThrow();
    expect(invoice.status).toBe('cancelled');
  });

  it('preserves a cancelled invoice instead of deleting its audit trail', async () => {
    const { service } = setup({ status: 'cancelled' });
    await expect(service.deleteInvoice(7, 1)).rejects.toThrow(/作废/);
  });

  it('requires authenticated current kit context for the void endpoint', async () => {
    const controller = new InvoiceController();
    controller.ctx = { state: { user: { id: 9 } } } as unknown as Context;
    controller.invoiceService = setup().service;
    const result = await controller.voidInvoice(7, { reason: '错误' });
    expect(result.success).toBe(false);
    expect(result.code).toBe(400);
  });
});
