import { SubscriptionService } from '../../src/service/subscription.service';

const createService = () => {
  const service = new SubscriptionService();
  
  // Mock query builder methods
  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    innerJoin: jest.fn().mockReturnThis(),
  };
  
  service.subscriptionRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    create: jest.fn(data => data),
    save: jest.fn(async data => ({ id: data.id || 1, ...data })),
    findOne: jest.fn(),
  } as any;
  service.typeRepository = {
    findOne: jest.fn(),
    create: jest.fn(data => data),
    save: jest.fn(async data => ({ id: data.id || 1, ...data })),
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  } as any;
  service.renewalLogRepository = {
    create: jest.fn(data => data),
    save: jest.fn(async data => ({ id: 1, ...data })),
    findOne: jest.fn(),
    remove: jest.fn(async data => data),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  } as any;
  service.pushLogRepository = {
    findOne: jest.fn(),
    create: jest.fn(data => data),
    save: jest.fn(async data => ({ id: 1, ...data })),
  } as any;
  service.subscriptionRenewalAttachmentService = {
    deleteAttachmentsByRenewalLogId: jest.fn(),
  } as any;
  service.subscriptionRenewalRecordService = {
    createRenewalRecord: jest.fn(),
  } as any;
  return service;
};

describe('SubscriptionService.createSubscription', () => {
  it('creates subscription with correct data', async () => {
    const service = createService();
    (service.typeRepository.findOne as jest.Mock).mockResolvedValue({ id: 1, kit_id: 2, status: 'active' });
    
    // Mock the getSubscriptionById method to return the created subscription
    service.getSubscriptionById = jest.fn().mockResolvedValue({
      id: 1,
      kit_id: 2,
      type_id: 1,
      name: '企微认证',
      subject: '主体',
      provider: '腾讯云',
      owner_name: '张三',
      cc_names: '李四,王五',
      fee: 300,
      notes: '年度认证费用',
      status: 'active',
    });
    
    await service.createSubscription({
      type_id: 1,
      name: '企微认证',
      subject: '主体',
      provider: '腾讯云',
      owner_name: '张三',
      cc_names: '李四,王五',
      fee: 300,
      notes: '年度认证费用',
      status: 'active'
    } as any, 2, 9);

    expect(service.subscriptionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      kit_id: 2,
      type_id: 1,
      name: '企微认证',
      subject: '主体',
      provider: '腾讯云',
      owner_name: '张三',
      cc_names: '李四,王五',
      fee: 300,
      notes: '年度认证费用',
      status: 'active',
      created_by: 9,
      updated_by: 9
    }));
  });
});

describe('SubscriptionService.updateSubscription', () => {
  it('updates subscription with correct data', async () => {
    const service = createService();
    const subscription = {
      id: 5,
      kit_id: 2,
      type_id: 1,
      name: '企微认证',
      subject: '主体',
      provider: '腾讯云',
      owner_name: '张三',
      cc_names: '李四,王五',
      fee: 300,
      notes: '年度认证费用',
      status: 'active',
    };
    (service.subscriptionRepository.findOne as jest.Mock).mockResolvedValue(subscription);
    
    // Mock the getSubscriptionById method to return the updated subscription
    service.getSubscriptionById = jest.fn().mockResolvedValue({
      ...subscription,
      name: '企微认证更新',
      fee: 400,
      status: 'inactive',
    });

    await service.updateSubscription(5, { 
      name: '企微认证更新', 
      fee: 400,
      status: 'inactive'
    }, 2, 9);

    expect(service.subscriptionRepository.save).toHaveBeenCalledWith(expect.objectContaining({ 
      name: '企微认证更新',
      fee: 400,
      status: 'inactive',
      updated_by: 9
    }));
  });

  it('does not change status when updating without specifying status', async () => {
    const service = createService();
    const subscription = {
      id: 5,
      kit_id: 2,
      type_id: 1,
      name: '企微认证',
      subject: '主体',
      provider: '腾讯云',
      owner_name: '张三',
      cc_names: '李四,王五',
      fee: 300,
      notes: '年度认证费用',
      status: 'inactive',
    };
    (service.subscriptionRepository.findOne as jest.Mock).mockResolvedValue(subscription);
    
    // Mock the getSubscriptionById method to return the subscription with same status
    service.getSubscriptionById = jest.fn().mockResolvedValue({
      ...subscription,
      status: 'inactive',
    });

    await service.updateSubscription(5, { notes: '已重新续费' }, 2, 9);

    expect(service.subscriptionRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'inactive' }));
  });

  it('keeps inactive when disabling subscription explicitly', async () => {
    const service = createService();
    const subscription = {
      id: 5,
      kit_id: 2,
      type_id: 1,
      name: '企微认证',
      subject: '主体',
      provider: '腾讯云',
      owner_name: '张三',
      cc_names: '李四,王五',
      fee: 300,
      notes: '年度认证费用',
      status: 'active',
    };
    (service.subscriptionRepository.findOne as jest.Mock).mockResolvedValue(subscription);

    await service.disableSubscription(5, 2, 9);

    expect(service.subscriptionRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'inactive' }));
  });

  it('explicitly enables an inactive subscription', async () => {
    const service = createService();
    const subscription = {
      id: 5,
      kit_id: 2,
      type_id: 1,
      name: '企微认证',
      subject: '主体',
      provider: '腾讯云',
      owner_name: '张三',
      cc_names: '李四,王五',
      fee: 300,
      notes: '年度认证费用',
      status: 'inactive',
    };
    (service.subscriptionRepository.findOne as jest.Mock).mockResolvedValue(subscription);

    await service.enableSubscription(5, 2, 9);

    expect(service.subscriptionRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
  });
});

describe('SubscriptionService.renewSubscription', () => {
  it('creates renewal record when renewing subscription', async () => {
    const service = createService();
    const subscription = {
      id: 5,
      kit_id: 2,
      name: '企微认证',
      subject: '主体',
      provider: '腾讯云',
      owner_name: '张三',
      cc_names: '李四,王五',
      fee: 300,
      notes: '年度认证费用',
      status: 'active',
    };
    (service.subscriptionRepository.findOne as jest.Mock).mockResolvedValue(subscription);
    
    // Mock the getSubscriptionById method to return the renewed subscription
    service.getSubscriptionById = jest.fn().mockResolvedValue(subscription);

    await service.renewSubscription(5, {
      renewal_date: '2024-01-15',
      next_reminder_date: '2024-12-01',
      remind_days_before: 30,
      reminder_mode: 'daily',
      fee: 400,
      renewal_method: '在线支付',
      remarks: '已续费'
    }, 2, 9);

    expect(service.subscriptionRenewalRecordService.createRenewalRecord).toHaveBeenCalledWith(5, {
      renewal_date: '2024-01-15',
      next_reminder_date: '2024-12-01',
      remind_days_before: 30,
      reminder_mode: 'daily',
      fee: 400,
      renewal_method: '在线支付',
      remarks: '已续费',
      status: 'active'
    }, 2, 9);
  });
});

describe('SubscriptionService.deleteRenewalLog', () => {
  it('deletes renewal attachments before removing the renewal log', async () => {
    const service = createService();
    const log = { id: 7, subscription_id: 3, kit_id: 2 };
    (service.renewalLogRepository.findOne as jest.Mock).mockResolvedValue(log);

    const result = await service.deleteRenewalLog(3, 7, 2);

    expect(result).toBe(true);
    expect(service.subscriptionRenewalAttachmentService.deleteAttachmentsByRenewalLogId).toHaveBeenCalledWith(7, 2);
    expect(service.renewalLogRepository.remove).toHaveBeenCalledWith(log);
  });

  it('returns false when deleting a missing renewal log', async () => {
    const service = createService();
    (service.renewalLogRepository.findOne as jest.Mock).mockResolvedValue(null);

    const result = await service.deleteRenewalLog(3, 7, 2);

    expect(result).toBe(false);
    expect(service.subscriptionRenewalAttachmentService.deleteAttachmentsByRenewalLogId).not.toHaveBeenCalled();
  });
});

describe('SubscriptionService.getDueSubscriptionsForPush', () => {
  it('returns active subscriptions that are due for push notification', async () => {
    const service = createService();
    
    // Mock subscription with renewal records
    const subscriptionWithRenewal = {
      id: 1,
      kit_id: 2,
      name: '企微认证',
      subject: '主体',
      owner_name: '张三',
      status: 'active',
      renewalRecords: [{
        id: 1,
        renewal_date: '2024-01-01',
        next_reminder_date: '2024-01-10',
        remind_days_before: 30,
        reminder_mode: 'daily',
        renewal_method: '在线支付',
        status: 'active'
      }]
    };
    
    const getMany = jest.fn().mockResolvedValue([subscriptionWithRenewal]);
    const whereMock = jest.fn().mockReturnThis();
    const andWhereMock = jest.fn().mockReturnThis();
    const innerJoinMock = jest.fn().mockReturnThis();
    const leftJoinAndSelectMock = jest.fn().mockReturnThis();
    const orderByMock = jest.fn().mockReturnThis();
    const mockQueryBuilder = {
      innerJoin: innerJoinMock,
      leftJoinAndSelect: leftJoinAndSelectMock,
      where: whereMock,
      andWhere: andWhereMock,
      orderBy: orderByMock,
      getMany,
    };
    (service.subscriptionRepository.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);
    (service.pushLogRepository.findOne as jest.Mock).mockResolvedValue(null);

    const result = await service.getDueSubscriptionsForPush(2, new Date('2024-01-10'));

    expect(whereMock).toHaveBeenCalledWith('subscription.status = :status', { status: 'active' });
    expect(andWhereMock).toHaveBeenCalledWith('subscription.kit_id = :kitId', { kitId: 2 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});