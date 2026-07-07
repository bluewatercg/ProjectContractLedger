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
