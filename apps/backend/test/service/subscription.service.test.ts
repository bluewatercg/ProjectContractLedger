import { SubscriptionService } from '../../src/service/subscription.service';

const createService = () => {
  const service = new SubscriptionService();
  service.subscriptionRepository = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(data => data),
    save: jest.fn(async data => ({ id: data.id || 1, ...data })),
    findOne: jest.fn(),
  } as any;
  service.typeRepository = {
    findOne: jest.fn(),
    create: jest.fn(data => data),
    save: jest.fn(async data => ({ id: data.id || 1, ...data })),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as any;
  service.renewalLogRepository = {
    create: jest.fn(data => data),
    save: jest.fn(async data => ({ id: 1, ...data })),
    createQueryBuilder: jest.fn(),
  } as any;
  service.pushLogRepository = {
    findOne: jest.fn(),
    create: jest.fn(data => data),
    save: jest.fn(async data => ({ id: 1, ...data })),
  } as any;
  return service;
};

describe('SubscriptionService.calculateNextExpiryDate', () => {
  it('adds day periods accurately', () => {
    const service = createService();
    expect(service.calculateNextExpiryDate('2024-01-01', 90, 'day')).toBe('2024-03-31');
  });

  it('adds month periods using month end when target day does not exist', () => {
    const service = createService();
    expect(service.calculateNextExpiryDate('2024-01-31', 1, 'month')).toBe('2024-02-29');
    expect(service.calculateNextExpiryDate('2023-01-31', 1, 'month')).toBe('2023-02-28');
  });

  it('adds year periods using month end when leap day target does not exist', () => {
    const service = createService();
    expect(service.calculateNextExpiryDate('2024-02-29', 1, 'year')).toBe('2025-02-28');
  });
});

describe('SubscriptionService.getExpiryStatus', () => {
  it('returns overdue, expiring, or normal by days until expiry', () => {
    const service = createService();
    expect(service.getExpiryStatus('2024-01-09', '2024-01-10', 30)).toEqual({ status: 'overdue', daysUntilExpiry: -1 });
    expect(service.getExpiryStatus('2024-01-20', '2024-01-10', 30)).toEqual({ status: 'expiring', daysUntilExpiry: 10 });
    expect(service.getExpiryStatus('2024-03-01', '2024-01-10', 30)).toEqual({ status: 'normal', daysUntilExpiry: 51 });
  });
});

describe('SubscriptionService.updateSubscription', () => {
  it('defaults blank status to active before saving', async () => {
    const service = createService();
    const subscription = {
      id: 5,
      kit_id: 2,
      type_id: 1,
      name: '企微认证',
      subject: '主体',
      current_expiry_date: '2024-01-31',
      renewal_period_value: 1,
      renewal_period_unit: 'year',
      remind_days_before: 30,
      owner_name: '张三',
      status: 'active',
    };
    (service.subscriptionRepository.findOne as jest.Mock).mockResolvedValue(subscription);

    await service.updateSubscription(5, { status: '' as any }, 2, 9);

    expect(service.subscriptionRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
  });
  it('reactivates inactive subscription when a normal update omits status', async () => {
    const service = createService();
    const subscription = {
      id: 5,
      kit_id: 2,
      type_id: 1,
      name: '企微认证',
      subject: '主体',
      current_expiry_date: '2024-01-31',
      renewal_period_value: 1,
      renewal_period_unit: 'year',
      remind_days_before: 30,
      owner_name: '张三',
      status: 'inactive',
    };
    (service.subscriptionRepository.findOne as jest.Mock).mockResolvedValue(subscription);

    await service.updateSubscription(5, { notes: '已重新续费' }, 2, 9);

    expect(service.subscriptionRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
  });

  it('explicitly enables an inactive subscription', async () => {
    const service = createService();
    const subscription = {
      id: 5,
      kit_id: 2,
      type_id: 1,
      name: '企微认证',
      subject: '主体',
      current_expiry_date: '2024-01-31',
      renewal_period_value: 1,
      renewal_period_unit: 'year',
      remind_days_before: 30,
      owner_name: '张三',
      status: 'inactive',
    };
    (service.subscriptionRepository.findOne as jest.Mock).mockResolvedValue(subscription);

    await service.enableSubscription(5, 2, 9);

    expect(service.subscriptionRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
  });

  it('keeps inactive when disabling subscription explicitly', async () => {
    const service = createService();
    const subscription = {
      id: 5,
      kit_id: 2,
      type_id: 1,
      name: '企微认证',
      subject: '主体',
      current_expiry_date: '2024-01-31',
      renewal_period_value: 1,
      renewal_period_unit: 'year',
      remind_days_before: 30,
      owner_name: '张三',
      status: 'active',
    };
    (service.subscriptionRepository.findOne as jest.Mock).mockResolvedValue(subscription);

    await service.disableSubscription(5, 2, 9);

    expect(service.subscriptionRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'inactive' }));
  });

});

describe('SubscriptionService.renewSubscription', () => {
  it('updates expiry date and creates renewal log when operator is admin for text owner', async () => {
    const service = createService();
    const subscription = {
      id: 5,
      kit_id: 2,
      current_expiry_date: '2024-01-31',
      renewal_period_value: 1,
      renewal_period_unit: 'month',
      owner_name: '张三',
      owner_user_id: null,
      cc_user_ids: null,
      status: 'active',
    };
    (service.subscriptionRepository.findOne as jest.Mock).mockResolvedValue(subscription);

    const result = await service.renewSubscription(5, 2, 9, '已续费', true);

    expect(result.current_expiry_date).toBe('2024-02-29');
    expect((result as any).renewal_log.id).toBe(1);
    expect(service.renewalLogRepository.create).toHaveBeenCalledWith({
      subscription_id: 5,
      kit_id: 2,
      previous_expiry_date: '2024-01-31',
      new_expiry_date: '2024-02-29',
      renewal_period_value: 1,
      renewal_period_unit: 'month',
      operated_by: 9,
      remarks: '已续费',
    });
    expect(service.subscriptionRepository.save).toHaveBeenCalled();
  });

  it('rejects renewal when operator is not owner, cc user, or admin', async () => {
    const service = createService();
    (service.subscriptionRepository.findOne as jest.Mock).mockResolvedValue({
      id: 5,
      kit_id: 2,
      owner_name: '张三',
      owner_user_id: null,
      cc_user_ids: null,
      current_expiry_date: '2024-01-31',
      renewal_period_value: 1,
      renewal_period_unit: 'month',
    });

    await expect(service.renewSubscription(5, 2, 12, 'test', false)).rejects.toThrow('无权确认该订阅已续费');
  });
});

describe('SubscriptionService.getDueSubscriptionsForPush', () => {
  it('returns active subscriptions that are within reminder window and excludes already pushed today', async () => {
    const service = createService();
    const getMany = jest.fn().mockResolvedValue([
      { id: 1, kit_id: 2, current_expiry_date: '2024-01-20', remind_days_before: 30, reminder_mode: 'daily', status: 'active' },
      { id: 2, kit_id: 2, current_expiry_date: '2024-03-20', remind_days_before: 30, reminder_mode: 'daily', status: 'active' },
    ]);
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany,
    };
    (service.subscriptionRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);
    (service.pushLogRepository.findOne as jest.Mock).mockResolvedValueOnce(null);

    const result = await service.getDueSubscriptionsForPush(2, '2024-01-10');

    expect(qb.where).toHaveBeenCalledWith('subscription.kit_id = :kitId', { kitId: 2 });
    expect(qb.andWhere).toHaveBeenCalledWith('subscription.status = :status', { status: 'active' });
    expect(result.map(item => item.id)).toEqual([1]);
    expect(result[0].daysUntilExpiry).toBe(10);
  });
  it('pushes once mode only on the configured reminder date', async () => {
    const service = createService();
    const getMany = jest.fn().mockResolvedValue([
      { id: 1, kit_id: 2, current_expiry_date: '2024-02-09', remind_days_before: 30, reminder_mode: 'once', status: 'active' },
      { id: 2, kit_id: 2, current_expiry_date: '2024-02-10', remind_days_before: 30, reminder_mode: 'once', status: 'active' },
      { id: 3, kit_id: 2, current_expiry_date: '2024-02-08', remind_days_before: 30, reminder_mode: 'daily', status: 'active' },
    ]);
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany,
    };
    (service.subscriptionRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);
    (service.pushLogRepository.findOne as jest.Mock).mockResolvedValue(null);

    const result = await service.getDueSubscriptionsForPush(2, '2024-01-10');

    expect(result.map(item => item.id)).toEqual([1, 3]);
  });

});
