import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionRecord } from '../entity/subscription-record.entity';
import { SubscriptionType } from '../entity/subscription-type.entity';
import { SubscriptionRenewalLog } from '../entity/subscription-renewal-log.entity';
import { SubscriptionPushLog } from '../entity/subscription-push-log.entity';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  CreateSubscriptionTypeDto,
  UpdateSubscriptionTypeDto,
  SubscriptionQuery,
  PaginationResult,
} from '../interface';

export interface SubscriptionStatusInfo {
  status: 'normal' | 'expiring' | 'overdue';
  daysUntilExpiry: number;
}

export interface DueSubscription extends SubscriptionRecord {
  expiryStatus?: 'normal' | 'expiring' | 'overdue';
  daysUntilExpiry?: number;
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

  async getTypes(kitId: number, status?: 'active' | 'disabled'): Promise<SubscriptionType[]> {
    const queryBuilder = this.typeRepository
      .createQueryBuilder('type')
      .where('type.kit_id = :kitId', { kitId })
      .orderBy('type.sort_order', 'ASC')
      .addOrderBy('type.id', 'ASC');

    if (status) {
      queryBuilder.andWhere('type.status = :status', { status });
    }

    return await queryBuilder.getMany();
  }

  async createType(dto: CreateSubscriptionTypeDto, kitId: number, userId: number): Promise<SubscriptionType> {
    const exists = await this.typeRepository.findOne({ where: { kit_id: kitId, code: dto.code } as any });
    if (exists) {
      throw new Error('事项类型编码已存在');
    }

    const count = await this.typeRepository.count({ where: { kit_id: kitId } as any });
    const type = this.typeRepository.create({
      kit_id: kitId,
      name: dto.name,
      code: dto.code,
      sort_order: dto.sort_order ?? (count + 1) * 10,
      status: dto.status || 'active',
      is_default: false,
      created_by: userId,
    });

    return await this.typeRepository.save(type);
  }

  async updateType(id: number, dto: UpdateSubscriptionTypeDto, kitId: number): Promise<SubscriptionType> {
    const type = await this.typeRepository.findOne({ where: { id, kit_id: kitId } as any });
    if (!type) {
      throw new Error('事项类型不存在');
    }

    if (dto.name !== undefined) type.name = dto.name;
    if (dto.status !== undefined) type.status = dto.status;
    if (dto.sort_order !== undefined) type.sort_order = dto.sort_order;

    return await this.typeRepository.save(type);
  }

  async getSubscriptions(query: SubscriptionQuery, kitId: number): Promise<PaginationResult<SubscriptionRecord>> {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);

    const queryBuilder = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.type', 'type')
      .leftJoinAndSelect('subscription.owner', 'owner')
      .where('subscription.kit_id = :kitId', { kitId });

    if (query.type_id) {
      queryBuilder.andWhere('subscription.type_id = :typeId', { typeId: query.type_id });
    }
    if (query.owner_user_id) {
      queryBuilder.andWhere('subscription.owner_user_id = :ownerUserId', { ownerUserId: query.owner_user_id });
    }
    if (query.owner_name) {
      queryBuilder.andWhere('subscription.owner_name LIKE :ownerName', { ownerName: `%${query.owner_name}%` });
    }
    if (query.status) {
      queryBuilder.andWhere('subscription.status = :status', { status: query.status });
    }
    if (query.search) {
      queryBuilder.andWhere('(subscription.name LIKE :search OR subscription.subject LIKE :search OR subscription.provider LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const sortBy = query.sortBy || 'current_expiry_date';
    const sortOrder = query.sortOrder || 'ASC';
    const safeSortBy = ['current_expiry_date', 'name', 'created_at', 'updated_at'].includes(sortBy) ? sortBy : 'current_expiry_date';

    queryBuilder
      .orderBy(`subscription.${safeSortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    let [items, total] = await queryBuilder.getManyAndCount();

    if (query.expiry_status) {
      const today = this.formatDate(new Date());
      items = items.filter(item => this.getExpiryStatus(item.current_expiry_date as any, today, item.remind_days_before).status === query.expiry_status);
      total = items.length;
    }

    return {
      items: items.map(item => this.decorateSubscription(item)) as SubscriptionRecord[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSubscriptionById(id: number, kitId: number): Promise<SubscriptionRecord> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, kit_id: kitId } as any,
      relations: ['type', 'owner', 'creator', 'updater'],
    });

    if (!subscription) {
      throw new Error('订阅事项不存在');
    }

    return this.decorateSubscription(subscription) as SubscriptionRecord;
  }

  async createSubscription(dto: CreateSubscriptionDto, kitId: number, userId: number): Promise<SubscriptionRecord> {
    await this.validateType(dto.type_id, kitId);
    this.validateSubscriptionDto(dto);

    const subscription = this.subscriptionRepository.create({
      kit_id: kitId,
      type_id: dto.type_id,
      name: dto.name,
      subject: dto.subject,
      provider: dto.provider || null,
      renewal_url: dto.renewal_url || null,
      current_expiry_date: dto.current_expiry_date as any,
      renewal_period_value: dto.renewal_period_value,
      renewal_period_unit: dto.renewal_period_unit,
      remind_days_before: dto.remind_days_before,
      owner_name: this.normalizeNullableText(dto.owner_name),
      owner_user_id: dto.owner_user_id ?? null,
      cc_user_ids: this.stringifyUserIds(dto.cc_user_ids),
      cc_names: this.normalizeNullableText(dto.cc_names),
      fee: dto.fee ?? null,
      notes: dto.notes || null,
      status: this.normalizeRecordStatus(dto.status),
      created_by: userId,
      updated_by: null,
    });

    return await this.subscriptionRepository.save(subscription);
  }

  async updateSubscription(id: number, dto: UpdateSubscriptionDto, kitId: number, userId: number): Promise<SubscriptionRecord> {
    const subscription = await this.subscriptionRepository.findOne({ where: { id, kit_id: kitId } as any });
    if (!subscription) {
      throw new Error('订阅事项不存在');
    }

    if (dto.type_id !== undefined) {
      await this.validateType(dto.type_id, kitId);
      subscription.type_id = dto.type_id;
    }
    if (dto.name !== undefined) subscription.name = dto.name;
    if (dto.subject !== undefined) subscription.subject = dto.subject;
    if (dto.provider !== undefined) subscription.provider = dto.provider || null;
    if (dto.renewal_url !== undefined) subscription.renewal_url = dto.renewal_url || null;
    if (dto.current_expiry_date !== undefined) subscription.current_expiry_date = dto.current_expiry_date as any;
    if (dto.renewal_period_value !== undefined) subscription.renewal_period_value = dto.renewal_period_value;
    if (dto.renewal_period_unit !== undefined) subscription.renewal_period_unit = dto.renewal_period_unit;
    if (dto.remind_days_before !== undefined) subscription.remind_days_before = dto.remind_days_before;
    if (dto.owner_name !== undefined) subscription.owner_name = this.normalizeNullableText(dto.owner_name);
    if (dto.owner_user_id !== undefined) subscription.owner_user_id = dto.owner_user_id ?? null;
    if (dto.cc_user_ids !== undefined) subscription.cc_user_ids = this.stringifyUserIds(dto.cc_user_ids);
    if (dto.cc_names !== undefined) subscription.cc_names = this.normalizeNullableText(dto.cc_names);
    if (dto.fee !== undefined) subscription.fee = dto.fee ?? null;
    if (dto.notes !== undefined) subscription.notes = dto.notes || null;
    if (dto.status !== undefined) subscription.status = this.normalizeRecordStatus(dto.status);
    subscription.updated_by = userId;

    this.validateSubscriptionDto(subscription as any);
    return await this.subscriptionRepository.save(subscription);
  }

  async disableSubscription(id: number, kitId: number, userId: number): Promise<SubscriptionRecord> {
    return await this.updateSubscription(id, { status: 'inactive' }, kitId, userId);
  }

  async renewSubscription(id: number, kitId: number, userId: number, remarks?: string, isAdmin = false): Promise<SubscriptionRecord> {
    const subscription = await this.subscriptionRepository.findOne({ where: { id, kit_id: kitId } as any });
    if (!subscription) {
      throw new Error('订阅事项不存在');
    }

    if (!this.canOperateRenewal(subscription, userId, isAdmin)) {
      throw new Error('无权确认该订阅已续费');
    }

    const previousExpiryDate = this.normalizeDateString(subscription.current_expiry_date as any);
    const newExpiryDate = this.calculateNextExpiryDate(
      previousExpiryDate,
      subscription.renewal_period_value,
      subscription.renewal_period_unit
    );

    const renewalLog = await this.renewalLogRepository.save(this.renewalLogRepository.create({
      subscription_id: subscription.id,
      kit_id: subscription.kit_id,
      previous_expiry_date: previousExpiryDate as any,
      new_expiry_date: newExpiryDate as any,
      renewal_period_value: subscription.renewal_period_value,
      renewal_period_unit: subscription.renewal_period_unit,
      operated_by: userId,
      remarks: remarks || null,
    }));

    subscription.current_expiry_date = newExpiryDate as any;
    subscription.updated_by = userId;
    const savedSubscription = await this.subscriptionRepository.save(subscription);
    return Object.assign(savedSubscription, { renewal_log: renewalLog });
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

  async getDueSubscriptionsForPush(kitId: number, today = this.formatDate(new Date())): Promise<DueSubscription[]> {
    const subscriptions = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.type', 'type')
      .leftJoinAndSelect('subscription.owner', 'owner')
      .where('subscription.kit_id = :kitId', { kitId })
      .andWhere('subscription.status = :status', { status: 'active' })
      .orderBy('subscription.current_expiry_date', 'ASC')
      .getMany();

    const result: DueSubscription[] = [];
    for (const subscription of subscriptions) {
      const statusInfo = this.getExpiryStatus(subscription.current_expiry_date as any, today, subscription.remind_days_before);
      if (statusInfo.status === 'normal') {
        continue;
      }

      const alreadyPushed = await this.pushLogRepository.findOne({
        where: { subscription_id: subscription.id, push_date: today as any } as any,
      });
      if (alreadyPushed) {
        continue;
      }

      result.push({
        ...subscription,
        expiryStatus: statusInfo.status,
        daysUntilExpiry: statusInfo.daysUntilExpiry,
      });
    }

    return result;
  }

  async markSubscriptionsPushed(items: DueSubscription[], today = this.formatDate(new Date())): Promise<void> {
    for (const item of items) {
      await this.pushLogRepository.save(this.pushLogRepository.create({
        subscription_id: item.id,
        kit_id: item.kit_id,
        push_date: today as any,
        push_type: (item.daysUntilExpiry || 0) < 0 ? 'overdue' : 'reminder',
        days_until_expiry: item.daysUntilExpiry ?? null,
      }));
    }
  }

  calculateNextExpiryDate(expiryDate: string | Date, periodValue: number, periodUnit: 'day' | 'month' | 'year'): string {
    const base = this.parseDateOnly(expiryDate);
    if (periodValue <= 0) {
      throw new Error('续费周期必须大于0');
    }

    if (periodUnit === 'day') {
      base.setUTCDate(base.getUTCDate() + periodValue);
      return this.formatDate(base);
    }

    const year = base.getUTCFullYear();
    const month = base.getUTCMonth();
    const day = base.getUTCDate();
    const targetMonthIndex = periodUnit === 'month' ? month + periodValue : month;
    const targetYear = periodUnit === 'year' ? year + periodValue : year + Math.floor(targetMonthIndex / 12);
    const normalizedTargetMonth = periodUnit === 'year' ? month : ((targetMonthIndex % 12) + 12) % 12;
    const lastDay = this.daysInMonth(targetYear, normalizedTargetMonth);
    const targetDay = Math.min(day, lastDay);

    return this.formatDate(new Date(Date.UTC(targetYear, normalizedTargetMonth, targetDay)));
  }

  getExpiryStatus(expiryDate: string | Date, today: string | Date, remindDaysBefore: number): SubscriptionStatusInfo {
    const daysUntilExpiry = this.diffDays(today, expiryDate);
    if (daysUntilExpiry < 0) {
      return { status: 'overdue', daysUntilExpiry };
    }
    if (daysUntilExpiry <= remindDaysBefore) {
      return { status: 'expiring', daysUntilExpiry };
    }
    return { status: 'normal', daysUntilExpiry };
  }

  private decorateSubscription(subscription: SubscriptionRecord): SubscriptionRecord & SubscriptionStatusInfo {
    const statusInfo = this.getExpiryStatus(
      subscription.current_expiry_date as any,
      this.formatDate(new Date()),
      subscription.remind_days_before
    );
    return Object.assign(subscription, statusInfo, {
      cc_user_id_list: this.parseUserIds(subscription.cc_user_ids),
    });
  }

  private async validateType(typeId: number, kitId: number): Promise<void> {
    const type = await this.typeRepository.findOne({ where: { id: typeId, kit_id: kitId, status: 'active' } as any });
    if (!type) {
      throw new Error('事项类型不存在或已停用');
    }
  }

  private validateSubscriptionDto(dto: Partial<CreateSubscriptionDto>): void {
    if (dto.renewal_period_value !== undefined && dto.renewal_period_value <= 0) {
      throw new Error('续费周期必须大于0');
    }
    if (dto.remind_days_before !== undefined && dto.remind_days_before < 0) {
      throw new Error('提前提醒天数不能小于0');
    }
    if (dto.owner_name !== undefined && !this.normalizeNullableText(dto.owner_name)) {
      throw new Error('请输入主负责人');
    }
  }

  private canOperateRenewal(subscription: SubscriptionRecord, userId: number, isAdmin: boolean): boolean {
    if (isAdmin) {
      return true;
    }
    if (subscription.owner_user_id === userId) {
      return true;
    }
    return this.parseUserIds(subscription.cc_user_ids).includes(userId);
  }

  private normalizeNullableText(value?: string | null): string | null {
    const text = value?.trim();
    return text || null;
  }

  private normalizeRecordStatus(status?: string | null): 'active' | 'inactive' {
    return status === 'inactive' ? 'inactive' : 'active';
  }

  private stringifyUserIds(ids?: number[] | string | null): string | null {
    if (!ids) return null;
    if (typeof ids === 'string') return ids || null;
    return ids.length > 0 ? ids.join(',') : null;
  }

  private parseUserIds(ids?: string | null): number[] {
    if (!ids) return [];
    return ids.split(',').map(id => Number(id.trim())).filter(id => !Number.isNaN(id));
  }

  private diffDays(fromDate: string | Date, toDate: string | Date): number {
    const from = this.parseDateOnly(fromDate);
    const to = this.parseDateOnly(toDate);
    return Math.round((to.getTime() - from.getTime()) / 86400000);
  }

  private parseDateOnly(value: string | Date): Date {
    if (value instanceof Date) {
      return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
    }
    const [year, month, day] = value.split('T')[0].split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  private normalizeDateString(value: string | Date): string {
    return this.formatDate(this.parseDateOnly(value));
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private daysInMonth(year: number, monthIndex: number): number {
    return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  }
}
