import { ContractService } from '../../src/service/contract.service';

describe('ContractService.getPreviousContractOptions', () => {
  it('returns customer contracts excluding the current contract and already linked contracts', async () => {
    const service = new ContractService();
    const getMany = jest.fn().mockResolvedValue([
      {
        id: 1,
        customer_id: 10,
        contract_number: 'CT001',
        title: '可选合同',
        previous_contract_id: null,
      },
    ]);
    const queryBuilder: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany,
    };
    service.contractRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as any;

    const result = await service.getPreviousContractOptions(10, 48);

    expect(service.contractRepository.createQueryBuilder).toHaveBeenCalledWith('contract');
    expect(queryBuilder.where).toHaveBeenCalledWith('contract.customer_id = :customerId', { customerId: 10 });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('contract.id != :currentContractId', { currentContractId: 48 });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'NOT EXISTS (SELECT 1 FROM contracts linked WHERE linked.previous_contract_id = contract.id AND linked.id != :currentContractId)',
      { currentContractId: 48 }
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('contract.created_at', 'DESC');
    expect(result).toEqual([
      {
        id: 1,
        customer_id: 10,
        contract_number: 'CT001',
        title: '可选合同',
        previous_contract_id: null,
      },
    ]);
  });
});

describe('ContractService.buildContractHistory', () => {
  const makeContract = (overrides: Record<string, any>) => ({
    id: overrides.id,
    kit_id: overrides.kit_id ?? 1,
    customer_id: overrides.customer_id ?? 10,
    contract_number: overrides.contract_number ?? `CT${overrides.id}`,
    title: overrides.title ?? `合同${overrides.id}`,
    total_amount: overrides.total_amount ?? 100,
    status: overrides.status ?? 'draft',
    start_date: overrides.start_date ?? `2024-0${overrides.id}-01`,
    end_date: overrides.end_date ?? `2024-0${overrides.id}-28`,
    previous_contract_id: overrides.previous_contract_id ?? null,
    created_at: overrides.created_at ?? `2024-0${overrides.id}-01T00:00:00.000Z`,
    updated_at: overrides.updated_at ?? `2024-0${overrides.id}-01T00:00:00.000Z`,
  });

  it('separates standalone contracts from a normal renewal chain', () => {
    const service = new ContractService();

    const result = service.buildContractHistory([
      makeContract({ id: 1, total_amount: 100, status: 'completed' }),
      makeContract({ id: 2, previous_contract_id: 1, total_amount: 200, status: 'active' }),
      makeContract({ id: 3, previous_contract_id: 2, total_amount: 300, status: 'draft' }),
      makeContract({ id: 4, total_amount: 400 }),
    ] as any);

    expect(result.standaloneContracts.map(contract => contract.id)).toEqual([4]);
    expect(result.contractChains).toHaveLength(1);
    expect(result.contractChains[0]).toMatchObject({
      contractCount: 3,
      totalAmount: 600,
      activeAmount: 200,
      rootContractId: 1,
      latestContractId: 3,
      hasBrokenLink: false,
      hasCycle: false,
    });
    expect(result.contractChains[0].items.map(item => item.id)).toEqual([1, 2, 3]);
  });

  it('returns the timeline containing the current contract and marks it current', () => {
    const service = new ContractService();

    const result = service.buildContractTimeline(
      [
        makeContract({ id: 1 }),
        makeContract({ id: 2, previous_contract_id: 1 }),
        makeContract({ id: 3, previous_contract_id: 2 }),
        makeContract({ id: 4 }),
      ] as any,
      2
    );

    expect(result.items.map(item => ({ id: item.id, isCurrent: item.isCurrent }))).toEqual([
      { id: 1, isCurrent: false },
      { id: 2, isCurrent: true },
      { id: 3, isCurrent: false },
    ]);
    expect(result.latestContractId).toBe(3);
  });

  it('marks missing previous_contract_id as a broken link without crossing customer or kit boundaries', () => {
    const service = new ContractService();

    const result = service.buildContractHistory([
      makeContract({ id: 1, kit_id: 1, customer_id: 10 }),
      makeContract({ id: 2, kit_id: 1, customer_id: 10, previous_contract_id: 99 }),
      makeContract({ id: 99, kit_id: 2, customer_id: 10 }),
      makeContract({ id: 100, kit_id: 1, customer_id: 11 }),
    ] as any);

    expect(result.standaloneContracts.map(contract => contract.id)).toEqual([1]);
    expect(result.contractChains).toHaveLength(1);
    expect(result.contractChains[0].hasBrokenLink).toBe(true);
    expect(result.contractChains[0].items.map(item => item.id)).toEqual([2]);
  });

  it('marks cycles and stops traversal', () => {
    const service = new ContractService();

    const result = service.buildContractHistory([
      makeContract({ id: 1, previous_contract_id: 3 }),
      makeContract({ id: 2, previous_contract_id: 1 }),
      makeContract({ id: 3, previous_contract_id: 2 }),
    ] as any);

    expect(result.contractChains).toHaveLength(1);
    expect(result.contractChains[0].hasCycle).toBe(true);
    expect(result.contractChains[0].items.map(item => item.id)).toEqual([1, 2, 3]);
    expect(result.standaloneContracts).toEqual([]);
  });
});
