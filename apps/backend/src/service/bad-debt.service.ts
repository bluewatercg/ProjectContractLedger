import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel, InjectDataSource } from '@midwayjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice } from '../entity/invoice.entity';
import { Contract } from '../entity/contract.entity';
import { ContractInvoicePlan } from '../entity/contract-invoice-plan.entity';
import { MarkBadDebtDto } from '../interface';

@Provide()
export class BadDebtService {
  @InjectEntityModel(Invoice)
  invoiceRepository: Repository<Invoice>;

  @InjectEntityModel(Contract)
  contractRepository: Repository<Contract>;

  @InjectEntityModel(ContractInvoicePlan)
  planRepository: Repository<ContractInvoicePlan>;

  @InjectDataSource()
  dataSource: DataSource;

  @Inject()
  contractService: any;

  @Inject()
  contractInvoicePlanService: any;

  @Inject()
  statisticsService: any;

  /**
   * 标记发票为坏账（支持全额或部分）
   */
  async markInvoiceAsBadDebt(
    invoiceId: number,
    dto: MarkBadDebtDto,
    kitId: number,
    userId: number
  ): Promise<any> {
    return await this.dataSource.transaction(async manager => {
      const invoice = await manager.findOne(Invoice, {
        where: { id: invoiceId, kit_id: kitId },
        relations: ['payments', 'contract', 'plan'],
      });

      if (!invoice) {
        throw new Error('发票不存在');
      }

      if (invoice.status === 'bad_debt') {
        throw new Error('该发票已标记为坏账');
      }

      // 计算未收金额
      const totalPaid =
        invoice.payments
          ?.filter((p: any) => p.status === 'completed')
          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0) || 0;
      const unpaidAmount = Number(invoice.total_amount) - totalPaid;

      if (dto.bad_debt_amount <= 0) {
        throw new Error('坏账金额必须大于 0');
      }

      if (dto.bad_debt_amount > unpaidAmount + 0.01) {
        throw new Error(
          `坏账金额不能超过未收金额 ¥${unpaidAmount.toFixed(2)}`
        );
      }

      // 更新发票坏账字段
      invoice.bad_debt_amount = dto.bad_debt_amount;
      invoice.bad_debt_reason = dto.bad_debt_reason || null;
      invoice.bad_debt_handler = userId;
      invoice.bad_debt_marked_at = new Date();

      // 如果坏账金额 >= 未收金额，标记为坏账状态
      if (dto.bad_debt_amount >= unpaidAmount - 0.01) {
        invoice.status = 'bad_debt';
      }

      await manager.save(Invoice, invoice);

      // 级联：重新计算关联的开票计划状态
      if (invoice.plan_id) {
        await this.recalcPlanStatus(invoice.plan_id, manager);
      }

      // 级联：重新计算合同财务统计（通过 contractService）
      if (this.statisticsService?.invalidateContractCache) {
        this.statisticsService.invalidateContractCache();
      }

      return {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        bad_debt_amount: invoice.bad_debt_amount,
        status: invoice.status,
      };
    });
  }

  /**
   * 撤销坏账标记
   */
  async undoBadDebt(
    invoiceId: number,
    kitId: number,
    userId: number
  ): Promise<any> {
    return await this.dataSource.transaction(async manager => {
      const invoice = await manager.findOne(Invoice, {
        where: { id: invoiceId, kit_id: kitId },
        relations: ['plan'],
      });

      if (!invoice) {
        throw new Error('发票不存在');
      }

      if (!invoice.bad_debt_amount || Number(invoice.bad_debt_amount) <= 0) {
        throw new Error('该发票未标记坏账');
      }

      // 恢复状态
      invoice.bad_debt_amount = 0;
      invoice.bad_debt_reason = null;
      invoice.bad_debt_handler = null;
      invoice.bad_debt_marked_at = null;

      // 恢复为 overdue 状态（因为之前是未付款的）
      if (invoice.status === 'bad_debt') {
        invoice.status = 'overdue';
      }

      await manager.save(Invoice, invoice);

      // 级联：重新计算开票计划状态
      if (invoice.plan_id) {
        await this.recalcPlanStatus(invoice.plan_id, manager);
      }

      if (this.statisticsService?.invalidateContractCache) {
        this.statisticsService.invalidateContractCache();
      }

      return {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        status: invoice.status,
      };
    });
  }

  /**
   * 查询发票坏账信息
   */
  async getInvoiceBadDebtInfo(
    invoiceId: number,
    kitId: number
  ): Promise<any | null> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, kit_id: kitId },
    });

    if (!invoice || !invoice.bad_debt_amount || Number(invoice.bad_debt_amount) <= 0) {
      return null;
    }

    return {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      bad_debt_amount: Number(invoice.bad_debt_amount),
      bad_debt_reason: invoice.bad_debt_reason,
      bad_debt_handler: invoice.bad_debt_handler,
      bad_debt_marked_at: invoice.bad_debt_marked_at,
      status: invoice.status,
    };
  }

  /**
   * 获取坏账统计
   */
  async getBadDebtStats(kitId: number, year?: number): Promise<any> {
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.bad_debt_amount > 0');

    if (kitId) {
      queryBuilder.andWhere('invoice.kit_id = :kitId', { kitId });
    }

    if (year) {
      queryBuilder.andWhere('YEAR(invoice.bad_debt_marked_at) = :year', { year });
    }

    const invoices = await queryBuilder.getMany();

    const totalCount = invoices.length;
    const totalAmount = invoices.reduce(
      (sum, inv) => sum + Number(inv.bad_debt_amount || 0),
      0
    );

    // 按合同分组
    const byContract: Record<number, any> = {};
    for (const inv of invoices) {
      const cid = inv.contract_id;
      if (!byContract[cid]) {
        byContract[cid] = {
          contractId: cid,
          badDebtAmount: 0,
          count: 0,
        };
      }
      byContract[cid].badDebtAmount += Number(inv.bad_debt_amount || 0);
      byContract[cid].count++;
    }

    // 按月份分组
    const byMonth: Record<string, { month: string; amount: number; count: number }> = {};
    for (const inv of invoices) {
      if (inv.bad_debt_marked_at) {
        const month = new Date(inv.bad_debt_marked_at).toISOString().slice(0, 7);
        if (!byMonth[month]) {
          byMonth[month] = { month, amount: 0, count: 0 };
        }
        byMonth[month].amount += Number(inv.bad_debt_amount || 0);
        byMonth[month].count++;
      }
    }

    return {
      totalCount,
      totalAmount,
      byContract: Object.values(byContract),
      byMonth: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)),
    };
  }

  /**
   * 重新计算开票计划状态（考虑坏账）
   */
  private async recalcPlanStatus(planId: number, manager: any): Promise<void> {
    const plan = await manager.findOne(ContractInvoicePlan, {
      where: { id: planId },
      relations: ['invoices'],
    });

    if (!plan || !plan.invoices || plan.invoices.length === 0) return;

    const nonCancelledInvoices = plan.invoices.filter(
      (inv: any) => inv.status !== 'cancelled'
    );

    if (nonCancelledInvoices.length === 0) {
      plan.status = 'pending';
    } else {
      const allBadDebt = nonCancelledInvoices.every(
        (inv: any) => inv.status === 'bad_debt'
      );

      if (allBadDebt) {
        plan.status = 'bad_debt';
      } else {
        // 使用原有逻辑重新计算
        const actual = nonCancelledInvoices.reduce(
          (sum: number, inv: any) => sum + Number(inv.total_amount || 0),
          0
        );
        plan.actual_invoiced_amount = actual;

        if (actual <= 0) {
          plan.status = 'pending';
        } else if (actual < Number(plan.planned_amount || 0)) {
          plan.status = 'partial_invoiced';
        } else {
          plan.status = 'invoiced';
        }
      }
    }

    await manager.save(ContractInvoicePlan, plan);
  }
}
