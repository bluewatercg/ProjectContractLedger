import { DataSource, EntitySchema } from 'typeorm';
import { Invoice } from '../../src/entity/invoice.entity';
import { Payment } from '../../src/entity/payment.entity';
import { Reconciliation } from '../../src/entity/reconciliation.entity';
import { PaymentService } from '../../src/service/payment.service';
import { ReconciliationService } from '../../src/service/reconciliation.service';
import { BadDebtService } from '../../src/service/bad-debt.service';

const invoiceSchema = new EntitySchema<Invoice>({
  name: 'Invoice',
  target: Invoice,
  columns: {
    id: { type: Number, primary: true },
    kit_id: { type: Number },
    contract_id: { type: Number },
    status: { type: String },
    bad_debt_amount: { type: Number },
  },
});
const paymentSchema = new EntitySchema<Payment>({
  name: 'Payment',
  target: Payment,
  columns: {
    id: { type: Number, primary: true },
    kit_id: { type: Number },
    invoice_id: { type: Number },
    status: { type: String },
    amount: { type: Number },
    payment_method: { type: String },
  },
  relations: {
    invoice: {
      type: 'many-to-one',
      target: 'Invoice',
      joinColumn: { name: 'invoice_id' },
    },
  },
});
const reconciliationSchema = new EntitySchema<Reconciliation>({
  name: 'Reconciliation',
  target: Reconciliation,
  columns: {
    id: { type: Number, primary: true },
    kit_id: { type: Number },
    invoice_id: { type: Number },
    status: { type: String },
    difference_amount: { type: Number },
  },
  relations: {
    invoice: {
      type: 'many-to-one',
      target: 'Invoice',
      joinColumn: { name: 'invoice_id' },
    },
  },
});

describe('effective statistics exclude void history and other kits', () => {
  let db: DataSource;
  beforeAll(async () => {
    db = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      entities: [invoiceSchema, paymentSchema, reconciliationSchema],
    });
    await db.initialize();
    await db.getRepository(Invoice).save([
      { id: 1, kit_id: 1, contract_id: 1, status: 'sent', bad_debt_amount: 10 },
      {
        id: 2,
        kit_id: 1,
        contract_id: 1,
        status: 'cancelled',
        bad_debt_amount: 900,
      },
      {
        id: 3,
        kit_id: 2,
        contract_id: 2,
        status: 'sent',
        bad_debt_amount: 800,
      },
    ]);
    await db.getRepository(Payment).save([
      {
        id: 1,
        kit_id: 1,
        invoice_id: 1,
        status: 'completed',
        amount: 100,
        payment_method: 'cash',
      },
      {
        id: 2,
        kit_id: 1,
        invoice_id: 2,
        status: 'completed',
        amount: 900,
        payment_method: 'cash',
      },
      {
        id: 3,
        kit_id: 2,
        invoice_id: 3,
        status: 'completed',
        amount: 800,
        payment_method: 'cash',
      },
      {
        id: 4,
        kit_id: 1,
        invoice_id: 1,
        status: 'failed',
        amount: 700,
        payment_method: 'cash',
      },
    ]);
    await db.getRepository(Reconciliation).save([
      {
        id: 1,
        kit_id: 1,
        invoice_id: 1,
        status: 'unmatched',
        difference_amount: 100,
      },
      {
        id: 2,
        kit_id: 1,
        invoice_id: 2,
        status: 'unmatched',
        difference_amount: 900,
      },
      {
        id: 3,
        kit_id: 2,
        invoice_id: 3,
        status: 'unmatched',
        difference_amount: 800,
      },
    ]);
  });
  afterAll(async () => {
    await db?.destroy();
  });

  it('excludes void receipts and isolates payment-method totals by kit', async () => {
    const service = new PaymentService();
    service.paymentRepository = db.getRepository(Payment);
    const stats = await service.getPaymentStats(undefined, 1);
    expect(stats.totalAmount).toBe(100);
    expect(stats.paymentMethodStats).toEqual([
      { method: 'cash', count: 1, amount: 100 },
    ]);
    expect(stats.failed).toBe(1);
  });

  it('excludes void reconciliation differences and counts', async () => {
    const service = new ReconciliationService();
    service.reconciliationRepository = db.getRepository(Reconciliation);
    expect(await service.getReconciliationStats(1)).toEqual({
      total: 1,
      byStatus: [{ status: 'unmatched', count: 1, totalDifference: 100 }],
    });
  });

  it('excludes legacy void bad debt', async () => {
    const service = new BadDebtService();
    service.invoiceRepository = db.getRepository(Invoice);
    const stats = await service.getBadDebtStats(1);
    expect(stats.totalAmount).toBe(10);
    expect(stats.totalCount).toBe(1);
  });
});
