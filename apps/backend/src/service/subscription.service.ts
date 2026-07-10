import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionRecord } from '../entity/subscription-record.entity';
import { SubscriptionType } from '../entity/subscription-type.entity';
import { SubscriptionRenewalLog } from '../entity/subscription-renewal-log.entity';
import { SubscriptionRenewalAttachmentService } from './subscription-renewal-attachment.service';
import { SubscriptionPushLog } from '../entity/subscription-push-log.entity';
import { SubscriptionRenewalRecordService } from './subscription-renewal-record.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionQuery,
  PaginationResult,
} from '../interface';

export interface DueSubscription {
  id: number;
  name: string;
  subject: string;
  owner_name?: string;
  renewal_url?: string;
  current_expiry_date?: string;
  type?: {
    id: number;
    name: string;
  };
  owner?: {
    id: number;
    username: string;
    full_name: string;
  };
  daysUntilExpiry?: number;
  renewalRecord?: any;
}

@Provide()
export class SubscriptionService {
  @InjectEntityModel(SubscriptionRecord)
  subscriptionRepository: Repository<SubscriptionRecord>;

  @InjectEntityModel(SubscriptionType)
  typeRepository: Repository<SubscriptionType>;

  @InjectEntityModel(SubscriptionRenewalLog)
  renewalLogRepository: Repository<SubscriptionRenewalLog>;

  @InjectEntityModel(SubscriptionPushLog)
  pushLogRepository: Repository<SubscriptionPushLog>;

  @Inject()
  subscriptionRenewalAttachmentService: SubscriptionRenewalAttachmentService;

  @Inject()
  subscriptionRenewalRecordService: SubscriptionRenewalRecordService;

  async getSubscriptions(query: SubscriptionQuery, kitId: number): Promise<PaginationResult<SubscriptionRecord>> {
    const qb = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.type', 'type')
      .leftJoinAndSelect('subscription.creator', 'creator')
      .leftJoinAndSelect('subscription.updater', 'updater')
      .leftJoinAndSelect('subscription.owner', 'owner')
      .where('subscription.kit_id = :kitId', { kitId });

    if (query.search) {
      qb.andWhere('(subscription.name LIKE :search OR subscription.subject LIKE :search OR subscription.notes LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.status) {
      qb.andWhere('subscription.status = :status', { status: query.status });
    }

    if (query.type_id) {
      qb.andWhere('subscription.type_id = :typeId', { typeId: query.type_id });
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('subscription.created_at', 'DESC')
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSubscriptionById(id: number, kitId: number): Promise<SubscriptionRecord> {
    const subscription = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.type', 'type')
      .leftJoinAndSelect('subscription.creator', 'creator')
      .leftJoinAndSelect('subscription.updater', 'updater')
      .leftJoinAndSelect('subscription.owner', 'owner')
      .leftJoinAndSelect('subscription.kit', 'kit')
      .where('subscription.id = :id', { id })
      .andWhere('subscription.kit_id = :kitId', { kitId })
      .getOne();

    if (!subscription) {
      throw new Error('订阅不存在');
    }

    return subscription;
  }

  async createSubscription(dto: CreateSubscriptionDto, kitId: number, userId: number): Promise<SubscriptionRecord> {
    const subscription = new SubscriptionRecord();
    subscription.kit_id = kitId;
    subscription.type_id = dto.type_id;
    subscription.name = dto.name;
    subscription.subject = dto.subject;
    subscription.provider = dto.provider || null;
    subscription.owner_name = dto.owner_name || null;
    subscription.owner_user_id = dto.owner_user_id || null;
    subscription.cc_user_ids = dto.cc_user_ids ? (Array.isArray(dto.cc_user_ids) ? dto.cc_user_ids.join(",") : dto.cc_user_ids) : null;
    subscription.cc_names = dto.cc_names || null;
    subscription.fee = dto.fee || null;
    subscription.notes = dto.notes || null;
    subscription.status = dto.status || 'active';
    subscription.created_by = userId;
    subscription.updated_by = userId;

    const saved = await this.subscriptionRepository.save(subscription);
    return await this.getSubscriptionById(saved.id, kitId);
  }

  async updateSubscription(id: number, dto: UpdateSubscriptionDto, kitId: number, userId: number): Promise<SubscriptionRecord> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, kit_id: kitId } as any,
    });

    if (!subscription) {
      throw new Error('订阅不存在');
    }

    if (dto.type_id !== undefined) subscription.type_id = dto.type_id;
    if (dto.name !== undefined) subscription.name = dto.name;
    if (dto.subject !== undefined) subscription.subject = dto.subject;
    if (dto.provider !== undefined) subscription.provider = dto.provider;
    if (dto.owner_name !== undefined) subscription.owner_name = dto.owner_name;
    if (dto.owner_user_id !== undefined) subscription.owner_user_id = dto.owner_user_id;
    if (dto.cc_user_ids !== undefined) subscription.cc_user_ids = dto.cc_user_ids ? (Array.isArray(dto.cc_user_ids) ? dto.cc_user_ids.join(",") : dto.cc_user_ids) : null;
    if (dto.cc_names !== undefined) subscription.cc_names = dto.cc_names;
    if (dto.fee !== undefined) subscription.fee = dto.fee;
    if (dto.notes !== undefined) subscription.notes = dto.notes;
    if (dto.status !== undefined) subscription.status = dto.status;
    subscription.updated_by = userId;

    const updated = await this.subscriptionRepository.save(subscription);
    return await this.getSubscriptionById(updated.id, kitId);
  }

  async disableSubscription(id: number, kitId: number, userId: number): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, kit_id: kitId } as any,
    });

    if (!subscription) {
      return false;
    }

    subscription.status = 'inactive';
    subscription.updated_by = userId;
    await this.subscriptionRepository.save(subscription);
    return true;
  }

  async enableSubscription(id: number, kitId: number, userId: number): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, kit_id: kitId } as any,
    });

    if (!subscription) {
      return false;
    }

    subscription.status = 'active';
    subscription.updated_by = userId;
    await this.subscriptionRepository.save(subscription);
    return true;
  }

  async renewSubscription(id: number, data: any, kitId: number, userId: number): Promise<SubscriptionRecord> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, kit_id: kitId } as any,
    });

    if (!subscription) {
      throw new Error('订阅不存在');
    }

    // 创建续费记录
    const renewalRecordData = {
      renewal_date: data.renewal_date || new Date().toISOString().split('T')[0],
      next_reminder_date: data.next_reminder_date,
      remind_days_before: data.remind_days_before || 0,
      reminder_mode: data.reminder_mode || 'daily',
      fee: data.fee || null,
      renewal_method: data.renewal_method || null,
      remarks: data.remarks || null,
      status: 'active' as 'active' | 'completed' | 'voided',
    };

    await this.subscriptionRenewalRecordService.createRenewalRecord(id, renewalRecordData, kitId, userId);

    return await this.getSubscriptionById(id, kitId);
  }

  async getRenewalLogs(subscriptionId: number, kitId: number): Promise<SubscriptionRenewalLog[]> {
    return await this.renewalLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.operator', 'operator')
      .leftJoinAndSelect('log.attachments', 'attachments')
      .where('log.subscription_id = :subscriptionId', { subscriptionId })
      .andWhere('log.kit_id = :kitId', { kitId })
      .orderBy('log.operated_at', 'DESC')
      .getMany();
  }

  async deleteRenewalLog(subscriptionId: number, renewalLogId: number, kitId: number): Promise<boolean> {
    const log = await this.renewalLogRepository.findOne({
      where: { id: renewalLogId, subscription_id: subscriptionId, kit_id: kitId } as any,
    });
    if (!log) {
      return false;
    }

    await this.subscriptionRenewalAttachmentService.deleteAttachmentsByRenewalLogId(renewalLogId, kitId);
    await this.renewalLogRepository.remove(log);
    return true;
  }

  async getDueSubscriptionsForPush(kitId: number, today: Date = new Date()): Promise<DueSubscription[]> {
    // 查询启用状态的订阅事项和它们的生效中续费记录
    const queryBuilder = this.subscriptionRepository.createQueryBuilder('subscription')
      .innerJoin('subscription.renewalRecords', 'renewal_record', 'renewal_record.status = :activeStatus', { activeStatus: 'active' })
      .leftJoinAndSelect('subscription.type', 'type')
      .leftJoinAndSelect('subscription.owner', 'owner')
      .where('subscription.status = :status', { status: 'active' })
      .andWhere('subscription.kit_id = :kitId', { kitId });

    const subscriptions = await queryBuilder.getMany();

    const result: DueSubscription[] = [];
    for (const subscription of subscriptions) {
      const renewalRecord = subscription.renewalRecords.find(rr => rr.status === 'active');
      if (!renewalRecord) continue;

      // 计算距离到期日的天数
      const expiryDate = renewalRecord.next_reminder_date ? new Date(renewalRecord.next_reminder_date) : today;
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // 检查今天是否已经推送过
      const pushDateKey = today.toISOString().split('T')[0];
      const hasPushedToday = await this.hasPushedToday(subscription.id, pushDateKey);

      // 根据提醒模式判断是否推送
      let shouldPush = false;
      if (renewalRecord.reminder_mode === 'daily') {
        // 每日提醒：从提醒日期开始到到期日期结束
        const reminderDate = new Date(renewalRecord.next_reminder_date);
        const daysUntilReminder = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        shouldPush = daysUntilReminder <= 0 && daysUntilExpiry >= 0;
        // 或者已逾期
        shouldPush = shouldPush || daysUntilExpiry < 0;
      } else if (renewalRecord.reminder_mode === 'once') {
        // 一次性提醒：仅在提醒日期当天
        const reminderDate = new Date(renewalRecord.next_reminder_date);
        const daysUntilReminder = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        shouldPush = daysUntilReminder === 0;
      }

      if (shouldPush && !hasPushedToday) {
        result.push({
          id: subscription.id,
          name: subscription.name,
          subject: subscription.subject,
          owner_name: subscription.owner_name,
          type: subscription.type,
          owner: subscription.owner,
          daysUntilExpiry,
          renewalRecord: {
            next_reminder_date: renewalRecord.next_reminder_date,
            reminder_mode: renewalRecord.reminder_mode,
            renewal_method: renewalRecord.renewal_method
          }
        });
      }
    }

    return result;
  }

  private async hasPushedToday(subscriptionId: number, pushDate: string): Promise<boolean> {
    const existingLog = await this.pushLogRepository.findOne({
      where: {
        subscription_id: subscriptionId,
        push_date: pushDate,
      } as any,
    });
    return !!existingLog;
  }

  async markSubscriptionsPushed(items: DueSubscription[], kitId: number): Promise<void> {
    for (const item of items) {
      const pushLog = new SubscriptionPushLog();
      pushLog.subscription_id = item.id;
      pushLog.push_date = new Date();
      pushLog.kit_id = kitId;
      await this.pushLogRepository.save(pushLog);
    }
  }
}