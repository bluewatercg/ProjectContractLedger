import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionRenewalRecord } from '../entity/subscription-renewal-record.entity';
import { CreateSubscriptionRenewalRecordDto, UpdateSubscriptionRenewalRecordDto, SubscriptionRenewalRecordResponse } from '../interface';
import { SubscriptionService } from './subscription.service';
import { DateUtil } from '../util/date.util';

@Provide()
export class SubscriptionRenewalRecordService {
  @InjectEntityModel(SubscriptionRenewalRecord)
  renewalRecordRepository: Repository<SubscriptionRenewalRecord>;

  @Inject()
  subscriptionService: SubscriptionService;

  async createRenewalRecord(subscriptionId: number, dto: CreateSubscriptionRenewalRecordDto, kitId: number, operatedBy?: number): Promise<SubscriptionRenewalRecordResponse> {
    if ((dto.status ?? 'active') === 'active') {
      await this.deactivateCurrentActiveRecords(subscriptionId, kitId);
    }

    // 创建新记录
    const renewalRecord = new SubscriptionRenewalRecord();
    renewalRecord.subscription_id = subscriptionId;
    renewalRecord.kit_id = kitId;
    if (dto.renewal_date) renewalRecord.renewal_date = new Date(dto.renewal_date);
    if (dto.next_reminder_date) renewalRecord.next_reminder_date = new Date(dto.next_reminder_date);
    renewalRecord.remind_days_before = dto.remind_days_before ?? 0;
    renewalRecord.reminder_mode = dto.reminder_mode ?? 'daily';
    renewalRecord.fee = dto.fee ?? null;
    renewalRecord.renewal_method = dto.renewal_method ?? null;
    renewalRecord.status = dto.status ?? 'active';
    renewalRecord.remarks = dto.remarks ?? null;
    renewalRecord.operated_by = operatedBy ?? null;

    const savedRecord = await this.renewalRecordRepository.save(renewalRecord);
    return this.toResponse(savedRecord);
  }

  async updateRenewalRecord(recordId: number, dto: UpdateSubscriptionRenewalRecordDto, kitId: number): Promise<SubscriptionRenewalRecordResponse> {
    const record = await this.renewalRecordRepository.findOne({
      where: { id: recordId, kit_id: kitId } as any,
    });

    if (!record) {
      throw new Error('续费记录不存在');
    }
    if (dto.status === 'active' && record.status !== 'active') {
      await this.deactivateCurrentActiveRecords(record.subscription_id, kitId);
    }

    if (dto.renewal_date !== undefined) record.renewal_date = dto.renewal_date ? new Date(dto.renewal_date) : null;
    if (dto.next_reminder_date !== undefined) record.next_reminder_date = dto.next_reminder_date ? new Date(dto.next_reminder_date) : null;
    if (dto.remind_days_before !== undefined) record.remind_days_before = dto.remind_days_before;
    if (dto.reminder_mode !== undefined) record.reminder_mode = dto.reminder_mode;
    if (dto.fee !== undefined) record.fee = dto.fee;
    if (dto.renewal_method !== undefined) record.renewal_method = dto.renewal_method;
    if (dto.status !== undefined) record.status = dto.status;
    if (dto.remarks !== undefined) record.remarks = dto.remarks;

    const updatedRecord = await this.renewalRecordRepository.save(record);
    return this.toResponse(updatedRecord);
  }

  async getRenewalRecord(recordId: number, kitId: number): Promise<SubscriptionRenewalRecordResponse> {
    const record = await this.renewalRecordRepository.findOne({
      where: { id: recordId, kit_id: kitId } as any,
      relations: ['operator'],
    });

    if (!record) {
      throw new Error('续费记录不存在');
    }

    return this.toResponse(record);
  }

  async getRenewalRecordsBySubscription(subscriptionId: number, kitId: number): Promise<SubscriptionRenewalRecordResponse[]> {
    const records = await this.renewalRecordRepository.find({
      where: { subscription_id: subscriptionId, kit_id: kitId } as any,
      order: { created_at: 'DESC' },
      relations: ['operator'],
    });

    return records.map(record => this.toResponse(record));
  }

  async getActiveRenewalRecord(subscriptionId: number, kitId: number): Promise<SubscriptionRenewalRecordResponse | null> {
    const record = await this.renewalRecordRepository.findOne({
      where: { subscription_id: subscriptionId, kit_id: kitId, status: 'active' } as any,
      relations: ['operator'],
    });

    return record ? this.toResponse(record) : null;
  }

  async deleteRenewalRecord(recordId: number, kitId: number): Promise<boolean> {
    const record = await this.renewalRecordRepository.findOne({
      where: { id: recordId, kit_id: kitId } as any,
    });

    if (!record) {
      return false;
    }

    // 如果删除的是 active 记录，尝试激活上一条 completed 记录
    if (record.status === 'active') {
      await this.activatePreviousCompletedRecord(record.subscription_id, kitId, recordId);
    }

    await this.renewalRecordRepository.remove(record);
    return true;
  }

  private async deactivateCurrentActiveRecords(subscriptionId: number, kitId: number): Promise<void> {
    const currentActiveRecords = await this.renewalRecordRepository.find({
      where: { subscription_id: subscriptionId, kit_id: kitId, status: 'active' } as any,
    });

    if (currentActiveRecords.length > 0) {
      currentActiveRecords.forEach(record => {
        record.status = 'completed';
      });
      await this.renewalRecordRepository.save(currentActiveRecords);
    }
  }

  private async activatePreviousCompletedRecord(subscriptionId: number, kitId: number, excludeRecordId?: number): Promise<void> {
    let whereClause: any = {
      subscription_id: subscriptionId,
      kit_id: kitId,
      status: 'completed',
    };
    
    if (excludeRecordId) {
      whereClause.id = whereClause.id || {};
      whereClause.id['<>'] = excludeRecordId;
    }

    // 获取最新的 completed 记录
    const previousRecord = await this.renewalRecordRepository.findOne({
      where: whereClause,
      order: { created_at: 'DESC' },
    });

    if (previousRecord) {
      previousRecord.status = 'active';
      await this.renewalRecordRepository.save(previousRecord);
    }
  }

  private toResponse(record: SubscriptionRenewalRecord): SubscriptionRenewalRecordResponse {
    const response: SubscriptionRenewalRecordResponse = {
      id: record.id,
      subscription_id: record.subscription_id,
      kit_id: record.kit_id,
      renewal_date: record.renewal_date ? DateUtil.formatDate(record.renewal_date) : null,
      next_reminder_date: record.next_reminder_date ? DateUtil.formatDate(record.next_reminder_date) : null,
      remind_days_before: record.remind_days_before,
      reminder_mode: record.reminder_mode,
      fee: record.fee,
      renewal_method: record.renewal_method,
      status: record.status,
      remarks: record.remarks,
      operated_by: record.operated_by,
      created_at: record.created_at.toISOString(),
      updated_at: record.updated_at.toISOString(),
    };

    if (record.operator) {
      response.operator = {
        id: record.operator.id,
        username: record.operator.username,
      };
    }

    return response;
  }
}