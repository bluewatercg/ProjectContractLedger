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
   * 按三个业务维度分类：
   * 1. 履约类（合同生命周期）：续签提醒、履约完成提醒
   * 2. 开票类（财务开票流程）：开票提醒
   * 3. 收款类（财务收款流程）：收款提醒
   */
  async getAllReminders(): Promise<ReminderSummary> {
    const [fulfillmentReminders, invoiceReminders, paymentReminders] =
      await Promise.all([
        this.getContractFulfillmentReminders(),
        this.getInvoiceNeededReminders(),
        this.getPaymentNeededReminders(),
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
   */
  async getContractFulfillmentReminders(): Promise<ReminderItem[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 90); // 提前90天检查

    // 获取即将到期的合同（无论是否续签）
    const expiringContracts = await this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .where('contract.status = :status', { status: 'active' })
      .andWhere('contract.end_date <= :futureDate', { futureDate })
      .andWhere('contract.end_date > :today', { today })
      .getMany();

    return expiringContracts.map(contract => {
      const daysUntilDue = Math.ceil(
        (new Date(contract.end_date).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      let priority: 'high' | 'medium' | 'low' = 'low';
      let type: 'contract_renewal' | 'contract_fulfillment';
      let title: string;
      let description: string;

      if (contract.is_renewable) {
        // 续签合同的提醒
        const reminderDays = parseInt(contract.renewal_reminder_days || '30');
        if (daysUntilDue <= 5) priority = 'high';
        else if (daysUntilDue <= reminderDays) priority = 'medium';

        type = 'contract_renewal';
        title = '合同即将到期，需要续签';
        description = `合同 ${contract.contract_number} 将在 ${daysUntilDue} 天后到期，请联系客户安排续签事宜`;
      } else {
        // 一次性合同的履约完成提醒
        if (daysUntilDue <= 7) priority = 'high';
        else if (daysUntilDue <= 15) priority = 'medium';

        type = 'contract_fulfillment';
        title = '合同即将到期，请确认履约完成';
        description = `合同 ${contract.contract_number} 将在 ${daysUntilDue} 天后到期，请确认项目履约完成情况`;
      }

      return {
        id: contract.id,
        type,
        priority,
        title,
        description,
        targetId: contract.id,
        targetType: 'contract' as const,
        daysUntilDue,
        amount: contract.total_amount,
        customerName: contract.customer?.name,
        contractNumber: contract.contract_number,
        dueDate: contract.end_date,
        actionUrl: `/contracts/${contract.id}`,
        category: 'fulfillment' as const,
      };
    });
  }

  /**
   * 获取需要开票提醒（开票类）
   * 签订合同后就应该开始开票流程，与合同履约状态无关
   */
  async getInvoiceNeededReminders(): Promise<ReminderItem[]> {
    // 查找已签署但没有发票或发票金额不足的合同
    const contractsNeedingInvoice = await this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoin('contract.invoices', 'invoice')
      .where('contract.status = :status', { status: 'active' })
      .andWhere('contract.start_date <= :today', { today: new Date() })
      .groupBy('contract.id')
      .having('COALESCE(SUM(invoice.total_amount), 0) < contract.total_amount') // 发票金额不足合同总额
      .getMany();

    return contractsNeedingInvoice.map(contract => {
      const daysSinceStart = Math.ceil(
        (Date.now() - new Date(contract.start_date).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (daysSinceStart > 30) priority = 'high';
      else if (daysSinceStart > 7) priority = 'medium';
      else priority = 'low';

      return {
        id: contract.id,
        type: 'invoice_needed',
        priority,
        title: '需要开具发票',
        description: `合同 ${contract.contract_number} 已生效 ${daysSinceStart} 天，需要开具发票或补充开票`,
        targetId: contract.id,
        targetType: 'contract' as const,
        daysUntilDue: daysSinceStart,
        amount: contract.total_amount,
        customerName: contract.customer?.name,
        contractNumber: contract.contract_number,
        actionUrl: `/invoices/create?contractId=${contract.id}`,
        category: 'invoice' as const,
      };
    });
  }

  /**
   * 获取需要收款提醒（收款类）
   * 已开票但未完全收款的发票需要跟进催收
   */
  async getPaymentNeededReminders(): Promise<ReminderItem[]> {
    // 查找已开票但未收款的发票
    const unpaidInvoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.contract', 'contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoin('invoice.payments', 'payment')
      .where('invoice.status IN (:...statuses)', {
        statuses: ['sent', 'overdue'],
      })
      .groupBy('invoice.id')
      .having('COALESCE(SUM(payment.amount), 0) < invoice.total_amount') // 未完全收款
      .getMany();

    return unpaidInvoices.map(invoice => {
      const daysSinceIssue = Math.ceil(
        (Date.now() - new Date(invoice.issue_date).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (daysSinceIssue > 60) priority = 'high';
      else if (daysSinceIssue > 30) priority = 'medium';
      else priority = 'low';

      return {
        id: invoice.id,
        type: 'payment_collection',
        priority,
        title: '需要跟进收款',
        description: `发票 ${invoice.invoice_number} 已开具 ${daysSinceIssue} 天，请跟进收款进度`,
        targetId: invoice.id,
        targetType: 'invoice' as const,
        daysUntilDue: daysSinceIssue,
        amount: invoice.total_amount,
        customerName: invoice.contract?.customer?.name,
        contractNumber: invoice.contract?.contract_number,
        invoiceNumber: invoice.invoice_number,
        actionUrl: `/payments/create?invoiceId=${invoice.id}`,
        category: 'payment' as const,
      };
    });
  }

  /**
   * 获取特定类型的提醒数量
   */
  async getReminderCount(type?: string): Promise<number> {
    if (!type) {
      const summary = await this.getAllReminders();
      return summary.total;
    }

    switch (type) {
      case 'fulfillment':
        return (await this.getContractFulfillmentReminders()).length;
      case 'invoice':
        return (await this.getInvoiceNeededReminders()).length;
      case 'payment':
        return (await this.getPaymentNeededReminders()).length;
      case 'contract_renewal':
      case 'contract_fulfillment':
        return (await this.getContractFulfillmentReminders()).filter(
          item => item.type === type
        ).length;
      case 'invoice_needed':
        return (await this.getInvoiceNeededReminders()).length;
      case 'payment_collection':
        return (await this.getPaymentNeededReminders()).length;
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
