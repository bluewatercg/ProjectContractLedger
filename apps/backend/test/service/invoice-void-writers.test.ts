import { PaymentService } from '../../src/service/payment.service';
import { ReconciliationService } from '../../src/service/reconciliation.service';
import { BadDebtService } from '../../src/service/bad-debt.service';
import { Invoice } from '../../src/entity/invoice.entity';
import { Payment } from '../../src/entity/payment.entity';
import { Reconciliation } from '../../src/entity/reconciliation.entity';

function createInvoice(overrides: Record<string, unknown> = {}): Invoice {
  return Object.assign(
    new Invoice(),
    {
      id: 10,
      kit_id: 1,
      contract_id: 5,
      plan_id: null,
      invoice_number: 'INV10',
      status: 'sent',
      total_amount: 50000,
      bad_debt_amount: 0,
    },
    overrides
  );
}

function createPayment(overrides: Record<string, unknown> = {}): Payment {
  return Object.assign(
    new Payment(),
    {
      id: 1,
      kit_id: 1,
      invoice_id: 10,
      amount: 10000,
      status: 'completed',
      payment_date: new Date(),
      payment_method: 'bank_transfer',
    },
    overrides
  );
}

function createReconciliation(
  overrides: Record<string, unknown> = {}
): Reconciliation {
  return Object.assign(
    new Reconciliation(),
    {
      id: 1,
      kit_id: 1,
      invoice_id: 10,
      invoice_amount: 50000,
      paid_amount: 40000,
      difference_amount: 10000,
      status: 'underpaid',
    },
    overrides
  );
}

function createMockManager(
  invoice: Invoice,
  payments: Payment[] = [],
  reconciliation?: Reconciliation
) {
  return {
    findOne: async (entity: any, options: any) => {
      if (entity === Invoice) {
        const matches = Object.entries(options.where).every(
          ([key, value]) => invoice[key] === value
        );
        return matches ? invoice : null;
      }
      if (entity === Payment) {
        return payments.find(p => p.id === options.where.id) || null;
      }
      if (entity === Reconciliation) {
        return reconciliation || null;
      }
      return null;
    },
    find: async (entity: any, options: any) => {
      if (entity === Payment) {
        return payments.filter(p => p.invoice_id === options.where.invoice_id);
      }
      return [];
    },
    save: async (...args: any[]) => args[args.length - 1],
    delete: async () => ({ affected: 1 }),
  };
}

describe('invoice void guards in writers', () => {
  describe('PaymentService', () => {
    it('rejects createPayment when invoice is cancelled', async () => {
      const invoice = createInvoice({ status: 'cancelled' });
      const manager = createMockManager(invoice);
      const service = new PaymentService();
      service.dataSource = {
        transaction: async (fn: any) => fn(manager),
      } as any;

      await expect(
        service.createPayment(
          { invoice_id: 10, amount: 10000, payment_date: new Date() } as any,
          1
        )
      ).rejects.toThrow(/作废/);
    });

    it('rejects updatePayment when invoice is cancelled', async () => {
      const invoice = createInvoice({ status: 'cancelled' });
      const payment = createPayment();
      const manager = createMockManager(invoice, [payment]);
      const service = new PaymentService();
      service.dataSource = {
        transaction: async (fn: any) => fn(manager),
      } as any;

      await expect(
        service.updatePayment(1, { amount: 20000 }, 1)
      ).rejects.toThrow(/作废/);
    });

    it('rejects deletePayment when invoice is cancelled', async () => {
      const invoice = createInvoice({ status: 'cancelled' });
      const payment = createPayment();
      const manager = createMockManager(invoice, [payment]);
      const service = new PaymentService();
      service.dataSource = {
        transaction: async (fn: any) => fn(manager),
      } as any;

      await expect(service.deletePayment(1, 1)).rejects.toThrow(/作废/);
    });

    it('rejects updatePayment when invoice_id does not match', async () => {
      const invoice = createInvoice({ status: 'sent' });
      const payment = createPayment({ invoice_id: 10, kit_id: 1 });
      const manager = createMockManager(invoice, [payment]);
      const service = new PaymentService();
      service.dataSource = {
        transaction: async (fn: any) => fn(manager),
      } as any;

      // Attempt to inject different invoice_id should throw error
      await expect(
        service.updatePayment(1, { amount: 20000, invoice_id: 999 } as any, 1)
      ).rejects.toThrow(/不允许修改发票ID/);
    });
  });

  describe('ReconciliationService', () => {
    it('rejects autoReconcile when invoice is cancelled', async () => {
      const invoice = createInvoice({ status: 'cancelled' });
      const manager = createMockManager(invoice);
      const service = new ReconciliationService();
      service.dataSource = {
        transaction: async (fn: any) => fn(manager),
      } as any;

      await expect(service.autoReconcile(10, 1, 1)).rejects.toThrow(/作废/);
    });

    it('rejects manualReconcile when invoice is cancelled', async () => {
      const invoice = createInvoice({ status: 'cancelled' });
      const manager = createMockManager(invoice);
      const service = new ReconciliationService();
      service.dataSource = {
        transaction: async (fn: any) => fn(manager),
      } as any;

      await expect(
        service.manualReconcile({
          invoiceId: 10,
          paymentIds: [1],
          userId: 1,
          kitId: 1,
        })
      ).rejects.toThrow(/作废/);
    });

    it('rejects handleDifference when invoice is cancelled', async () => {
      const invoice = createInvoice({ status: 'cancelled' });
      const reconciliation = createReconciliation({ invoice_id: 10 });
      const manager = createMockManager(invoice, [], reconciliation);
      const service = new ReconciliationService();
      service.dataSource = {
        transaction: async (fn: any) => fn(manager),
      } as any;

      await expect(
        service.handleDifference(1, 'adjust_invoice', '调整金额', 1, 1)
      ).rejects.toThrow(/作废/);
    });
  });

  describe('BadDebtService', () => {
    it('rejects markInvoiceAsBadDebt when invoice is cancelled', async () => {
      const invoice = createInvoice({ status: 'cancelled' });
      const manager = createMockManager(invoice);
      const service = new BadDebtService();
      service.dataSource = {
        transaction: async (fn: any) => fn(manager),
      } as any;

      await expect(
        service.markInvoiceAsBadDebt(10, { bad_debt_amount: 5000 } as any, 1, 1)
      ).rejects.toThrow(/作废/);
    });

    it('rejects undoBadDebt when invoice is cancelled', async () => {
      const invoice = createInvoice({
        status: 'cancelled',
        bad_debt_amount: 5000,
      });
      const manager = createMockManager(invoice);
      const service = new BadDebtService();
      service.dataSource = {
        transaction: async (fn: any) => fn(manager),
      } as any;

      await expect(service.undoBadDebt(10, 1, 1)).rejects.toThrow(/作废/);
    });
  });
});
