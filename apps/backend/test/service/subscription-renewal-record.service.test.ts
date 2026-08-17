import { SubscriptionRenewalRecordService } from '../../src/service/subscription-renewal-record.service';

type RenewalRecordStatus = 'active' | 'completed' | 'voided';

const makeRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  subscription_id: 5,
  kit_id: 2,
  renewal_date: new Date('2026-09-13T00:00:00.000Z'),
  next_reminder_date: new Date('2026-10-13T00:00:00.000Z'),
  remind_days_before: 0,
  reminder_mode: 'daily' as const,
  fee: null,
  renewal_method: null,
  status: 'active' as RenewalRecordStatus,
  remarks: null,
  operated_by: 9,
  created_at: new Date('2026-09-13T00:00:00.000Z'),
  updated_at: new Date('2026-09-13T00:00:00.000Z'),
  ...overrides,
});

const createService = () => {
  const service = new SubscriptionRenewalRecordService();
  service.renewalRecordRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(async record => ({
      ...record,
      id: Array.isArray(record) ? undefined : record.id || 3,
      created_at: Array.isArray(record) ? undefined : record.created_at || new Date('2026-09-13T00:00:00.000Z'),
      updated_at: Array.isArray(record) ? undefined : record.updated_at || new Date('2026-09-13T00:00:00.000Z'),
    })),
    remove: jest.fn(),
  } as unknown as typeof service.renewalRecordRepository;
  return service;
};

describe('SubscriptionRenewalRecordService.createRenewalRecord', () => {
  it('preserves the current active record when adding completed history', async () => {
    const service = createService();
    const activeRecord = makeRecord();
    (service.renewalRecordRepository.findOne as jest.Mock).mockResolvedValue(activeRecord);

    await service.createRenewalRecord(5, {
      renewal_date: '2025-09-13',
      next_reminder_date: '2025-10-13',
      status: 'completed',
    }, 2, 9);

    expect(service.renewalRecordRepository.findOne).not.toHaveBeenCalled();
    expect(service.renewalRecordRepository.save).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, status: 'completed' })
    );
  });

  it('completes every active record in the same kit before adding a new active record', async () => {
    const service = createService();
    const activeRecords = [makeRecord({ id: 1 }), makeRecord({ id: 2 })];
    (service.renewalRecordRepository.find as jest.Mock).mockResolvedValue(activeRecords);

    await service.createRenewalRecord(5, {
      renewal_date: '2026-10-13',
      next_reminder_date: '2026-11-13',
      status: 'active',
    }, 2, 9);

    expect(service.renewalRecordRepository.find).toHaveBeenCalledWith({
      where: { subscription_id: 5, kit_id: 2, status: 'active' },
    });
    expect(service.renewalRecordRepository.save).toHaveBeenCalledWith(activeRecords);
    expect(activeRecords.every(record => record.status === 'completed')).toBe(true);
  });
});
