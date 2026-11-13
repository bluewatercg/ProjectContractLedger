import { DataSource, EntityManager, EntityTarget } from 'typeorm';
import { InvoicePlanAllocationService } from '../../src/service/invoice-plan-allocation.service';
import { InvoicePlanAllocation } from '../../src/entity/invoice-plan-allocation.entity';
import { ContractInvoicePlan } from '../../src/entity/contract-invoice-plan.entity';
import { Invoice } from '../../src/entity/invoice.entity';

function invoiceEntity(overrides: Partial<Invoice> = {}): Invoice {
  return Object.assign(new Invoice(), {
    id: 10,
    kit_id: 1,
    contract_id: 3,
    invoice_number: 'INV10',
    status: 'sent',
    total_amount: 10000,
    ...overrides,
  });
}

function planEntity(
  overrides: Partial<ContractInvoicePlan> = {}
): ContractInvoicePlan {
  return Object.assign(new ContractInvoicePlan(), {
    id: 4,
    kit_id: 1,
    contract_id: 3,
    phase_name: '首付款',
    planned_amount: 6000,
    actual_invoiced_amount: 0,
    status: 'pending',
    ...overrides,
  });
}

describe('InvoicePlanAllocationService.replaceInvoiceAllocations', () => {
  const buildService = (plans: ContractInvoicePlan[], existing: any[] = []) => {
    const saved: any[] = [];
    const deleted: any[] = [];

    const manager = {
      find: async (entity: EntityTarget<any>) => {
        if (entity === ContractInvoicePlan) return plans;
        if (entity === InvoicePlanAllocation) return existing;
        return [];
      },
      create: (_entity: any, data: any) => ({ ...data }),
      save: async (entity: any, data: any) => {
        saved.push({ entity, data });
        return data;
      },
      delete: async (entity: any, id: any) => {
        deleted.push({ entity, id });
        return { affected: 1 };
      },
    } as unknown as EntityManager;

    const service = new InvoicePlanAllocationService();
    service.recalcPlan = jest.fn(async () => undefined) as any;

    return { service, manager, saved, deleted };
  };

  it('splits one invoice across multiple plans', async () => {
    const plans = [
      planEntity({ id: 4, planned_amount: 6000 }),
      planEntity({ id: 5, phase_name: '二期', planned_amount: 4000 }),
    ];
    const { service, manager, saved } = buildService(plans);

    await service.replaceInvoiceAllocations(
      invoiceEntity({ total_amount: 10000 }),
      1,
      [
        { plan_id: 4, allocated_amount: 6000 },
        { plan_id: 5, allocated_amount: 4000 },
      ],
      manager
    );

    expect(saved).toHaveLength(2);
    expect(saved.map(item => item.data.allocated_amount)).toEqual([6000, 4000]);
    // 两个计划都要重算
    expect((service.recalcPlan as jest.Mock).mock.calls.map(c => c[0])).toEqual([
      4, 5,
    ]);
  });

  it('rejects allocation totals exceeding the invoice amount', async () => {
    const { service, manager } = buildService([
      planEntity({ id: 4 }),
      planEntity({ id: 5 }),
    ]);

    await expect(
      service.replaceInvoiceAllocations(
        invoiceEntity({ total_amount: 10000 }),
        1,
        [
          { plan_id: 4, allocated_amount: 6000 },
          { plan_id: 5, allocated_amount: 6000 },
        ],
        manager
      )
    ).rejects.toThrow(/超过发票总额/);
  });

  it('rejects duplicate plans in one submission', async () => {
    const { service, manager } = buildService([planEntity({ id: 4 })]);
    await expect(
      service.replaceInvoiceAllocations(
        invoiceEntity(),
        1,
        [
          { plan_id: 4, allocated_amount: 1000 },
          { plan_id: 4, allocated_amount: 1000 },
        ],
        manager
      )
    ).rejects.toThrow(/重复/);
  });

  it('rejects a plan from another contract', async () => {
    const { service, manager } = buildService([
      planEntity({ id: 4, contract_id: 99 }),
    ]);
    await expect(
      service.replaceInvoiceAllocations(
        invoiceEntity({ contract_id: 3 }),
        1,
        [{ plan_id: 4, allocated_amount: 1000 }],
        manager
      )
    ).rejects.toThrow(/所属合同/);
  });

  it('rejects a plan from another kit', async () => {
    const { service, manager } = buildService([
      planEntity({ id: 4, kit_id: 2 }),
    ]);
    await expect(
      service.replaceInvoiceAllocations(
        invoiceEntity(),
        1,
        [{ plan_id: 4, allocated_amount: 1000 }],
        manager
      )
    ).rejects.toThrow(/套账/);
  });

  it('rejects non-positive allocation amounts', async () => {
    const { service, manager } = buildService([planEntity({ id: 4 })]);
    await expect(
      service.replaceInvoiceAllocations(
        invoiceEntity(),
        1,
        [{ plan_id: 4, allocated_amount: 0 }],
        manager
      )
    ).rejects.toThrow(/必须大于 0/);
  });

  it('unbinds plans that are no longer submitted', async () => {
    const existing = [
      Object.assign(new InvoicePlanAllocation(), {
        id: 77,
        invoice_id: 10,
        plan_id: 5,
        kit_id: 1,
        allocated_amount: 4000,
      }),
    ];
    const { service, manager, deleted } = buildService(
      [planEntity({ id: 4 })],
      existing
    );

    await service.replaceInvoiceAllocations(
      invoiceEntity(),
      1,
      [{ plan_id: 4, allocated_amount: 6000 }],
      manager
    );

    expect(deleted).toHaveLength(1);
    expect(deleted[0].id).toBe(77);
  });
});

describe('InvoicePlanAllocationService plan recalc', () => {
  const buildRecalc = (
    plan: ContractInvoicePlan,
    allocations: Array<{ allocated_amount: number; invoice: any }>
  ) => {
    const saved: any[] = [];
    const qb = {
      innerJoinAndSelect: () => qb,
      where: () => qb,
      setLock: () => qb,
      getMany: async () => allocations,
    };
    const manager = {
      findOne: async () => plan,
      createQueryBuilder: () => qb,
      save: async (_entity: any, data: any) => {
        saved.push(data);
        return data;
      },
    } as unknown as EntityManager;
    const service = new InvoicePlanAllocationService();
    return { service, manager, saved };
  };

  it('marks a plan as invoiced when allocation reaches the planned amount', async () => {
    const plan = planEntity({ planned_amount: 6000 });
    const { service, manager } = buildRecalc(plan, [
      { allocated_amount: 6000, invoice: { status: 'sent' } },
    ]);
    await service.recalcPlan(4, manager);
    expect(Number(plan.actual_invoiced_amount)).toBe(6000);
    expect(plan.status).toBe('invoiced');
  });

  it('marks a plan as partially invoiced below the planned amount', async () => {
    const plan = planEntity({ planned_amount: 6000 });
    const { service, manager } = buildRecalc(plan, [
      { allocated_amount: 2000, invoice: { status: 'sent' } },
    ]);
    await service.recalcPlan(4, manager);
    expect(Number(plan.actual_invoiced_amount)).toBe(2000);
    expect(plan.status).toBe('partial_invoiced');
  });

  it('allows allocations to exceed the planned amount', async () => {
    const plan = planEntity({ planned_amount: 6000 });
    const { service, manager } = buildRecalc(plan, [
      { allocated_amount: 9000, invoice: { status: 'sent' } },
    ]);
    await service.recalcPlan(4, manager);
    expect(Number(plan.actual_invoiced_amount)).toBe(9000);
    expect(plan.status).toBe('invoiced');
  });

  it('excludes cancelled invoices from the allocated amount', async () => {
    const plan = planEntity({ planned_amount: 6000 });
    const { service, manager } = buildRecalc(plan, [
      { allocated_amount: 6000, invoice: { status: 'cancelled' } },
      { allocated_amount: 1000, invoice: { status: 'sent' } },
    ]);
    await service.recalcPlan(4, manager);
    expect(Number(plan.actual_invoiced_amount)).toBe(1000);
    expect(plan.status).toBe('partial_invoiced');
  });

  it('marks the plan as bad debt only when every contributing invoice is bad debt', async () => {
    const plan = planEntity({ planned_amount: 6000 });
    const { service, manager } = buildRecalc(plan, [
      { allocated_amount: 3000, invoice: { status: 'bad_debt' } },
    ]);
    await service.recalcPlan(4, manager);
    expect(plan.status).toBe('bad_debt');
  });

  it('returns to pending when nothing is allocated', async () => {
    const plan = planEntity({ planned_amount: 6000, status: 'invoiced' });
    const { service, manager } = buildRecalc(plan, []);
    await service.recalcPlan(4, manager);
    expect(Number(plan.actual_invoiced_amount)).toBe(0);
    expect(plan.status).toBe('pending');
  });
});

describe('InvoicePlanAllocationService plan-side guards', () => {
  it('rejects an invoice belonging to another contract', async () => {
    const plan = planEntity({ id: 4, contract_id: 3, kit_id: 1 });
    const otherInvoice = invoiceEntity({ id: 20, contract_id: 8 });
    const manager = {
      findOne: async (entity: EntityTarget<any>) =>
        entity === ContractInvoicePlan ? plan : null,
      find: async (entity: EntityTarget<any>) => {
        if (entity === InvoicePlanAllocation) return [];
        if (entity === Invoice) return [otherInvoice];
        return [];
      },
    } as unknown as EntityManager;

    const service = new InvoicePlanAllocationService();
    service.dataSource = {
      transaction: async (fn: any) => fn(manager),
    } as unknown as DataSource;

    await expect(
      service.replacePlanAllocations(3, 4, 1, [
        { invoice_id: 20, allocated_amount: 1000 },
      ])
    ).rejects.toThrow(/不属于该合同/);
  });
});
