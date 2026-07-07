import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../entity/contract.entity';
import { Invoice } from '../entity/invoice.entity';
import { Payment } from '../entity/payment.entity';

export interface ReminderItem {
  id: number;
  type:
  | 'contract_renewal'
  | 'contract_fulfillment'
  | 'invoice_needed'
  | 'payment_collection';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  targetId: number;
  targetType: 'contract' | 'invoice';
  daysUntilDue?: number;
  amount?: number;
  customerName?: string;
  contractNumber?: string;
  invoiceNumber?: string;
  dueDate?: Date;
  actionUrl?: string;
  // 业务分类：履约类（合同生命周期）| 开票类（财务开票流程）| 收款类（财务收款流程）
  category: 'fulfillment' | 'invoice' | 'payment';
}

export interface ReminderSummary {
  total: number;
  high: number;
  medium: number;
  low: number;
  items: ReminderItem[];
}

@Provide()
export class ReminderService {
  @InjectEntityModel(Contract)
  contractRepository: Repository<Contract>;

  @InjectEntityModel(Invoice)
  invoiceRepository: Repository<Invoice>;

  @InjectEntityModel(Payment)
  paymentRepository: Repository<Payment>;

  /**
   * 获取所有提醒事项
   */
  async getAllReminders(kitId?: number): Promise<ReminderSummary> {
    const [fulfillmentReminders, invoiceReminders, paymentReminders] =
      await Promise.all([
        this.getContractFulfillmentReminders(kitId),
        this.getInvoiceNeededReminders(kitId),
        this.getPaymentNeededReminders(kitId),
      ]);

    const allItems = [
      ...fulfillmentReminders,
      ...invoiceReminders,
      ...paymentReminders,
    ];

    // 按优先级和到期时间排序
    allItems.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // 同优先级按到期时间排序
      if (a.daysUntilDue !== undefined && b.daysUntilDue !== undefined) {
        return a.daysUntilDue - b.daysUntilDue;
      }
      return 0;
    });

    const summary = {
      total: allItems.length,
      high: allItems.filter(item => item.priority === 'high').length,
      medium: allItems.filter(item => item.priority === 'medium').length,
      low: allItems.filter(item => item.priority === 'low').length,
      items: allItems.slice(0, 20), // 最多返回20条
    };

    return summary;
  }

  /**
   * 获取合同履约相关提醒（履约类）
   * 包括：续签提醒、履约完成提醒
   * 续签合同：只有当剩余天数 <= 提醒天数时才产生提醒
   * 一次性合同：剩余天数 <= 15天时产生提醒
   * 已到期合同：只要状态还是active就产生提醒（高优先级）
   */
  async getContractFulfillmentReminders(kitId?: number): Promise<ReminderItem[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 90); // 提前90天检查

    const queryBuilder = this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .where('contract.status = :status', { status: 'active' });

    if (kitId) {
      queryBuilder.andWhere('contract.kit_id = :kitId', { kitId });
    }

    // 获取即将到期或已到期但未关闭的合同
    const expiringContracts = await queryBuilder
      .andWhere('contract.renewal_confirmed_at IS NULL')
      .andWhere(
        'NOT EXISTS (SELECT 1 FROM contracts successor WHERE successor.previous_contract_id = contract.id)'
      )
      .andWhere('contract.end_date <= :futureDate', { futureDate })
      // 不再限制 end_date > today，以便包含已到期的合同
      .getMany();

    const reminders: ReminderItem[] = [];

    for (const contract of expiringContracts) {
      const diffTime = new Date(contract.end_date).getTime() - today.getTime();
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let priority: 'high' | 'medium' | 'low' = 'low';
      let type: 'contract_renewal' | 'contract_fulfillment';
      let title: string;
      let description: string;
      let shouldRemind = false;

      // 1. 已到期合同（置顶提醒）
      if (daysUntilDue <= 0) {
        shouldRemind = true;
        priority = 'high';
        type = contract.is_renewable ? 'contract_renewal' : 'contract_fulfillment';
        title = contract.is_renewable ? '合同已到期，请确认续签或不续签' : '合同已到期，请确认履约关闭';
        description = `合同 ${contract.contract_number} 已于 ${Math.abs(daysUntilDue)} 天前到期，目前状态仍为执行中，请及时处理。`;
      }
      // 2. 将到期合（续签）
      else if (contract.is_renewable) {
        const reminderDays = parseInt(contract.renewal_reminder_days || '30');
        if (daysUntilDue <= reminderDays) {
          shouldRemind = true;
          if (daysUntilDue <= 5) priority = 'high';
          else if (daysUntilDue <= 15) priority = 'medium';
          else priority = 'low';

          type = 'contract_renewal';
          title = '合同即将到期，需要续签';
          description = `合同 ${contract.contract_number} 将在 ${daysUntilDue} 天后到期，请联系客户安排续签事宜`;
        }
      }
      // 3. 将到期（一次性）
      else if (daysUntilDue <= 15) {
        shouldRemind = true;
        if (daysUntilDue <= 7) priority = 'high';
        else priority = 'medium';

        type = 'contract_fulfillment';
        title = '合同即将到期，请确认履约完成';
        description = `合同 ${contract.contract_number} 将在 ${daysUntilDue} 天后到期，请确认项目履约完成情况`;
      }

      if (shouldRemind) {
        reminders.push({
          id: contract.id,
          type: type!,
          priority: priority,
          title: title!,
          description: description!,
          targetId: contract.id,
          targetType: 'contract' as const,
          daysUntilDue: daysUntilDue,
          amount: contract.total_amount,
          customerName: contract.customer?.name,
          contractNumber: contract.contract_number,
          dueDate: contract.end_date,
          actionUrl: `/contracts/${contract.id}`,
          category: 'fulfillment' as const,
        });
      }
    }

    return reminders;
  }

  /**
   * 获取需要开票提醒（开票类）
   */
  async getInvoiceNeededReminders(kitId?: number): Promise<ReminderItem[]> {
    const queryBuilder = this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('contract.invoices', 'invoice')
      .where('contract.status = :status', { status: 'active' })
      .andWhere('contract.start_date <= :today', { today: new Date() });

    if (kitId) {
      queryBuilder.andWhere('contract.kit_id = :kitId', { kitId });
    }

    const activeContracts = await queryBuilder.getMany();

    const reminders: ReminderItem[] = [];

    for (const contract of activeContracts) {
      const invoicedAmount = contract.invoices
        ? contract.invoices.reduce(
          (sum, invoice) => sum + Number(invoice.total_amount),
          0
        )
        : 0;

      const contractAmount = Number(contract.total_amount);
      const pendingAmount = contractAmount - invoicedAmount;

      if (pendingAmount > 0) {
        const daysSinceStart = Math.ceil(
          (Date.now() - new Date(contract.start_date).getTime()) /
          (1000 * 60 * 60 * 24)
        );

        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (daysSinceStart > 30) priority = 'high';
        else if (daysSinceStart > 7) priority = 'medium';
        else priority = 'low';

        reminders.push({
          id: contract.id,
          type: 'invoice_needed',
          priority: priority,
          title: '需要开具发票',
          description: `合同 ${contract.contract_number
            } 已生效 ${daysSinceStart} 天，待开票金额 ¥${pendingAmount.toFixed(
              2
            )}`,
          targetId: contract.id,
          targetType: 'contract' as const,
          daysUntilDue: daysSinceStart,
          amount: pendingAmount,
          customerName: contract.customer?.name,
          contractNumber: contract.contract_number,
          actionUrl: `/contracts/${contract.id}`,
          category: 'invoice' as const,
        });
      }
    }

    return reminders;
  }

  /**
   * 获取需要收款提醒（收款类）
   */
  async getPaymentNeededReminders(kitId?: number): Promise<ReminderItem[]> {
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.contract', 'contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect(
        'invoice.payments',
        'payment',
        'payment.status = :paymentStatus',
        { paymentStatus: 'completed' }
      )
      .where('invoice.status IN (:...statuses)', {
        statuses: ['draft', 'sent', 'paid', 'overdue'],
      })
      .andWhere('(invoice.bad_debt_amount IS NULL OR invoice.bad_debt_amount = 0 OR invoice.bad_debt_amount < invoice.total_amount)');

    if (kitId) {
      queryBuilder.andWhere('invoice.kit_id = :kitId', { kitId });
    }

    const invoices = await queryBuilder.getMany();

    const reminders: ReminderItem[] = [];

    for (const invoice of invoices) {
      const paidAmount = invoice.payments
        ? invoice.payments.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0
        )
        : 0;

      const invoiceAmount = Number(invoice.total_amount);
      const pendingAmount = invoiceAmount - paidAmount;

      // 只有待收款金额大于0.01才需要提醒（考虑浮点数精度）
      if (pendingAmount > 0.01) {
        const referenceDate = invoice.issue_date || invoice.created_at || new Date();
        const daysSinceIssue = Math.ceil(
          (Date.now() - new Date(referenceDate).getTime()) /
          (1000 * 60 * 60 * 24)
        );

        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (daysSinceIssue > 60) priority = 'high';
        else if (daysSinceIssue > 30) priority = 'medium';
        else priority = 'low';

        reminders.push({
          id: invoice.id,
          type: 'payment_collection',
          priority: priority,
          title: '需要跟进收款',
          description: `发票 ${invoice.invoice_number
            } 已开具 ${daysSinceIssue} 天，待收款金额 ¥${pendingAmount.toFixed(
              2
            )}`,
          targetId: invoice.id,
          targetType: 'invoice' as const,
          daysUntilDue: daysSinceIssue,
          amount: pendingAmount,
          customerName: invoice.contract?.customer?.name,
          contractNumber: invoice.contract?.contract_number,
          invoiceNumber: invoice.invoice_number,
          actionUrl: `/invoices/${invoice.id}`,
          category: 'payment' as const,
        });
      }
    }

    return reminders;
  }

  /**
   * 获取特定类型的提醒数量
   */
  async getReminderCount(type?: string, kitId?: number): Promise<number> {
    if (!type) {
      const summary = await this.getAllReminders(kitId);
      return summary.total;
    }

    switch (type) {
      case 'fulfillment':
        return (await this.getContractFulfillmentReminders(kitId)).length;
      case 'invoice':
        return (await this.getInvoiceNeededReminders(kitId)).length;
      case 'payment':
        return (await this.getPaymentNeededReminders(kitId)).length;
      case 'contract_renewal':
      case 'contract_fulfillment':
        return (await this.getContractFulfillmentReminders(kitId)).filter(
          item => item.type === type
        ).length;
      case 'invoice_needed':
        return (await this.getInvoiceNeededReminders(kitId)).length;
      case 'payment_collection':
        return (await this.getPaymentNeededReminders(kitId)).length;
      default:
        return 0;
    }
  }

  /**
   * 标记提醒为已处理（暂时使用内存存储，实际应该存储到数据库）
   */
  async markReminderAsHandled(id: number, type: string): Promise<boolean> {
    // TODO: 实现提醒处理记录的持久化存储
    console.log(`Reminder marked as handled: ${type} - ${id}`);
    return true;
  }
}
