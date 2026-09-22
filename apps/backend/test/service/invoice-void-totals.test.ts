import { ContractService } from '../../src/service/contract.service';

const makeInvoice = (overrides: Record<string, unknown>) => ({
  id: 1,
  invoice_number: 'INV1',
  total_amount: 0,
  bad_debt_amount: 0,
  status: 'sent',
  payments: [],
  ...overrides,
});

const makeContract = (amount: number, invoices: unknown[]) => ({
  total_amount: amount,
  invoices,
});

describe('calculateFinancialStats excludes cancelled invoices', () => {
  const service = new ContractService();

  it('treats a single cancelled invoice as zero invoiced', () => {
    const contract = makeContract(100000, [
      makeInvoice({
        id: 1,
        invoice_number: 'INV1',
        total_amount: 30000,
        status: 'cancelled',
      }),
    ]);

    const stats = service.calculateFinancialStats(contract);

    expect(stats.invoicedAmount).toBe(0);
    expect(stats.uninvoicedAmount).toBe(100000);
    expect(stats.paidAmount).toBe(0);
    expect(stats.unpaidAmount).toBe(0);
    expect(stats.invoiceCount).toBe(0);
    expect(stats.billingStatus).toBe('pending_invoice');
  });

  it('only counts valid invoices when mixed with cancelled ones', () => {
    const contract = makeContract(100000, [
      makeInvoice({
        id: 1,
        invoice_number: 'INV1',
        total_amount: 50000,
        status: 'sent',
      }),
      makeInvoice({
        id: 2,
        invoice_number: 'INV2',
        total_amount: 30000,
        status: 'cancelled',
      }),
    ]);

    const stats = service.calculateFinancialStats(contract);

    expect(stats.invoicedAmount).toBe(50000);
    expect(stats.uninvoicedAmount).toBe(50000);
    expect(stats.invoiceCount).toBe(1);
  });
});
