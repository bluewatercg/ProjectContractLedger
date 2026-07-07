import { ReminderService } from '../../src/service/reminder.service';

describe('ReminderService.getContractFulfillmentReminders', () => {
  it('excludes contracts already renewed by confirmation or successor contract', async () => {
    const service = new ReminderService();
    const getMany = jest.fn().mockResolvedValue([]);
    const queryBuilder: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany,
    };
    service.contractRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as any;

    const result = await service.getContractFulfillmentReminders(2);

    expect(service.contractRepository.createQueryBuilder).toHaveBeenCalledWith('contract');
    expect(queryBuilder.where).toHaveBeenCalledWith('contract.status = :status', { status: 'active' });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('contract.kit_id = :kitId', { kitId: 2 });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('contract.renewal_confirmed_at IS NULL');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'NOT EXISTS (SELECT 1 FROM contracts successor WHERE successor.previous_contract_id = contract.id)'
    );
    expect(result).toEqual([]);
  });
});
