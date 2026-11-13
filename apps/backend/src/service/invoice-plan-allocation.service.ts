import { Provide } from '@midwayjs/core';
import { InjectEntityModel, InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { InvoicePlanAllocation } from '../entity/invoice-plan-allocation.entity';
import { ContractInvoicePlan } from '../entity/contract-invoice-plan.entity';
import { Invoice } from '../entity/invoice.entity';

export interface AllocationItem {
  plan_id: number;
  allocated_amount: number;
}

export interface PlanSideAllocationItem {
  invoice_id: number;
  allocated_amount: number;
}

/** 金额比较容差，避免 decimal 与浮点混算产生的分位误差 */
const AMOUNT_EPSILON = 0.01;

@Provide()
export class InvoicePlanAllocationService {
  @InjectEntityModel(InvoicePlanAllocation)
  allocationRepository: Repository<InvoicePlanAllocation>;

  @InjectEntityModel(ContractInvoicePlan)
  planRepository: Repository<ContractInvoicePlan>;

  @InjectEntityModel(Invoice)
  invoiceRepository: Repository<Invoice>;

  @InjectDataSource()
  dataSource: DataSource;

  /**
   * 查询某张发票的全部计划分摊
   */
  async getAllocationsByInvoice(
    invoiceId: number,
    kitId?: number
  ): Promise<InvoicePlanAllocation[]> {
    const where: any = { invoice_id: invoiceId };
    if (kitId) {
      where.kit_id = kitId;
    }
    return this.allocationRepository.find({
      where,
      relations: ['plan'],
      order: { id: 'ASC' },
    });
  }

  /**
   * 查询某个开票计划已关联的发票明细
   */
  async getAllocationsByPlan(
    contractId: number,
    planId: number,
    kitId?: number
  ): Promise<any[]> {
    const qb = this.allocationRepository
      .createQueryBuilder('allocation')
      .innerJoinAndSelect('allocation.invoice', 'invoice')
      .innerJoin('allocation.plan', 'plan')
      .where('allocation.plan_id = :planId', { planId })
      .andWhere('plan.contract_id = :contractId', { contractId })
      .andWhere('invoice.status <> :cancelled', { cancelled: 'cancelled' });

    if (kitId) {
      qb.andWhere('allocation.kit_id = :kitId', { kitId });
    }

    const rows = await qb.orderBy('invoice.issue_date', 'ASC').getMany();

    return rows.map(row => ({
      id: row.id,
      invoice_id: row.invoice_id,
      allocated_amount: Number(row.allocated_amount),
      invoice_number: row.invoice.invoice_number,
      total_amount: Number(row.invoice.total_amount),
      issue_date: row.invoice.issue_date,
      status: row.invoice.status,
    }));
  }

  /**
   * 计划侧弹窗数据源：本合同下可用于分摊的发票
   * 返回每张票的总额、已在其他计划分摊额、在本计划分摊额与剩余可分摊额
   */
  async getAllocatableInvoices(
    contractId: number,
    planId: number,
    kitId?: number
  ): Promise<any[]> {
    const qb = this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.contract_id = :contractId', { contractId })
      .andWhere('invoice.status <> :cancelled', { cancelled: 'cancelled' });

    if (kitId) {
      qb.andWhere('invoice.kit_id = :kitId', { kitId });
    }

    const invoices = await qb.orderBy('invoice.issue_date', 'ASC').getMany();
    if (invoices.length === 0) {
      return [];
    }

    const ids = invoices.map(item => item.id);
    const sums = await this.allocationRepository
      .createQueryBuilder('allocation')
      .select('allocation.invoice_id', 'invoice_id')
      .addSelect('SUM(allocation.allocated_amount)', 'allocated_total')
      .addSelect(
        'SUM(CASE WHEN allocation.plan_id = :planId THEN allocation.allocated_amount ELSE 0 END)',
        'allocated_this'
      )
      .where('allocation.invoice_id IN (:...ids)', { ids })
      .setParameter('planId', planId)
      .groupBy('allocation.invoice_id')
      .getRawMany();

    const sumMap = new Map<number, { total: number; thisOne: number }>();
    sums.forEach(row => {
      sumMap.set(Number(row.invoice_id), {
        total: Number(row.allocated_total) || 0,
        thisOne: Number(row.allocated_this) || 0,
      });
    });

    return invoices.map(invoice => {
      const sum = sumMap.get(invoice.id) ?? { total: 0, thisOne: 0 };
      return {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        total_amount: Number(invoice.total_amount),
        issue_date: invoice.issue_date,
        status: invoice.status,
        allocated_total: sum.total,
        allocated_this_plan: sum.thisOne,
        allocated_elsewhere: Number((sum.total - sum.thisOne).toFixed(2)),
        remaining: Number(
          (Number(invoice.total_amount) - sum.total + sum.thisOne).toFixed(2)
        ),
      };
    });
  }

  /**
   * 计划侧：批量设置某期关联的发票及金额
   * 未出现在 items 中的既有分摊会被解绑
   */
  async replacePlanAllocations(
    contractId: number,
    planId: number,
    kitId: number,
    items: PlanSideAllocationItem[]
  ): Promise<void> {
    if (!kitId) throw new Error('请选择当前套账');
    if (!Array.isArray(items)) throw new Error('分摊数据格式不正确');

    await this.dataSource.transaction(async manager => {
      const plan = await this.lockPlan(manager, planId);
      this.assertPlanBelongs(plan, contractId, kitId);

      const normalized = this.normalizeAllocations<{
        plan_id: number;
        invoice_id: number;
        allocated_amount: number;
      }>(
        items.map(item => ({
          plan_id: planId,
          allocated_amount: item.allocated_amount,
          invoice_id: item.invoice_id,
        })),
        'invoice_id'
      );

      const invoiceIds = normalized.map(item => item.invoice_id);
      const invoices = invoiceIds.length
        ? await manager.find(Invoice, { where: { id: In(invoiceIds) } })
        : [];
      const invoiceMap = new Map(invoices.map(item => [item.id, item]));

      for (const item of normalized) {
        const invoice = invoiceMap.get(item.invoice_id);
        if (!invoice) throw new Error(`发票 ${item.invoice_id} 不存在`);
        if (invoice.kit_id !== kitId) {
          throw new Error(`发票 ${invoice.invoice_number} 不属于当前套账`);
        }
        if (invoice.contract_id !== contractId) {
          throw new Error(`发票 ${invoice.invoice_number} 不属于该合同`);
        }
        if (invoice.status === 'cancelled') {
          throw new Error(`发票 ${invoice.invoice_number} 已作废，无法分摊`);
        }
      }

      await this.assertInvoiceTotals(invoiceMap, normalized, manager, planId);
      const existing = await manager.find(InvoicePlanAllocation, {
        where: { plan_id: planId, kit_id: kitId },
        lock: { mode: 'pessimistic_write' },
      });
      const existingByInvoice = new Map(
        existing.map(row => [row.invoice_id, row])
      );

      for (const item of normalized) {
        const row = existingByInvoice.get(item.invoice_id);
        if (row) {
          row.allocated_amount = item.allocated_amount;
          await manager.save(InvoicePlanAllocation, row);
        } else {
          await manager.save(
            InvoicePlanAllocation,
            manager.create(InvoicePlanAllocation, {
              kit_id: kitId,
              invoice_id: item.invoice_id,
              plan_id: planId,
              allocated_amount: item.allocated_amount,
            })
          );
        }
        existingByInvoice.delete(item.invoice_id);
      }

      for (const removed of existingByInvoice.values()) {
        await manager.delete(InvoicePlanAllocation, removed.id);
      }

      await this.recalcPlan(planId, manager);
    });
  }

  /**
   * 计划侧：解绑单张发票
   */
  async removeAllocation(
    contractId: number,
    planId: number,
    invoiceId: number,
    kitId: number
  ): Promise<void> {
    if (!kitId) throw new Error('请选择当前套账');
    await this.dataSource.transaction(async manager => {
      const plan = await this.lockPlan(manager, planId);
      this.assertPlanBelongs(plan, contractId, kitId);

      const row = await manager.findOne(InvoicePlanAllocation, {
        where: { plan_id: planId, invoice_id: invoiceId, kit_id: kitId },
      });
      if (!row) throw new Error('该发票未关联此开票计划');

      await manager.delete(InvoicePlanAllocation, row.id);
      await this.recalcPlan(planId, manager);
    });
  }

  /**
   * 发票侧：设置该发票的计划分摊（整体替换）
   * 在调用方事务内执行，保证与发票写入同生共死
   */
  async replaceInvoiceAllocations(
    invoice: Invoice,
    kitId: number,
    items: AllocationItem[],
    manager: EntityManager
  ): Promise<void> {
    if (!Array.isArray(items)) throw new Error('分摊数据格式不正确');

    const normalized = this.normalizeAllocations<AllocationItem>(
      items,
      'plan_id'
    );
    const planIds = normalized.map(item => item.plan_id);

    const plans = planIds.length
      ? await manager.find(ContractInvoicePlan, { where: { id: In(planIds) } })
      : [];
    const planMap = new Map(plans.map(item => [item.id, item]));

    for (const item of normalized) {
      const plan = planMap.get(item.plan_id);
      if (!plan) throw new Error(`开票计划 ${item.plan_id} 不存在`);
      if (plan.contract_id !== invoice.contract_id) {
        throw new Error('开票计划所属合同与发票合同不一致');
      }
      if (plan.kit_id !== kitId) {
        throw new Error('开票计划所属套账与当前套账不一致');
      }
      if (plan.status === 'cancelled') {
        throw new Error(`开票计划「${plan.phase_name}」已取消，无法分摊`);
      }
    }

    const total = normalized.reduce(
      (sum, item) => sum + item.allocated_amount,
      0
    );
    if (total > Number(invoice.total_amount) + AMOUNT_EPSILON) {
      throw new Error(
        `分摊合计 ¥${total.toFixed(2)} 超过发票总额 ¥${Number(
          invoice.total_amount
        ).toFixed(2)}`
      );
    }

    const existing = await manager.find(InvoicePlanAllocation, {
      where: { invoice_id: invoice.id, kit_id: kitId },
      lock: { mode: 'pessimistic_write' },
    });
    const existingByPlan = new Map(existing.map(row => [row.plan_id, row]));
    const affectedPlanIds = new Set<number>(existing.map(row => row.plan_id));

    for (const item of normalized) {
      const row = existingByPlan.get(item.plan_id);
      if (row) {
        row.allocated_amount = item.allocated_amount;
        await manager.save(InvoicePlanAllocation, row);
      } else {
        await manager.save(
          InvoicePlanAllocation,
          manager.create(InvoicePlanAllocation, {
            kit_id: kitId,
            invoice_id: invoice.id,
            plan_id: item.plan_id,
            allocated_amount: item.allocated_amount,
          })
        );
      }
      existingByPlan.delete(item.plan_id);
      affectedPlanIds.add(item.plan_id);
    }

    for (const removed of existingByPlan.values()) {
      await manager.delete(InvoicePlanAllocation, removed.id);
    }

    for (const planId of affectedPlanIds) {
      await this.recalcPlan(planId, manager);
    }
  }

  /**
   * 发票金额/状态变化后，重算其涉及的全部计划
   */
  async recalcPlansForInvoice(
    invoiceId: number,
    manager?: EntityManager
  ): Promise<void> {
    const execute = async (mgr: EntityManager) => {
      const rows = await mgr.find(InvoicePlanAllocation, {
        where: { invoice_id: invoiceId },
        select: ['plan_id'],
      });
      const planIds = [...new Set(rows.map(row => row.plan_id))];
      for (const planId of planIds) {
        await this.recalcPlan(planId, mgr);
      }
    };
    if (manager) {
      await execute(manager);
    } else {
      await this.dataSource.transaction(execute);
    }
  }

  /**
   * 重算计划的已开票金额与状态
   *
   * - 已开票金额 = 未作废发票在该计划上的分摊额之和
   * - 全部贡献发票均为坏账时，计划标记为坏账
   * - 其余情况按计划金额比较：0 -> pending，未满 -> partial_invoiced，达到/超出 -> invoiced
   */
  async recalcPlan(planId: number, manager?: EntityManager): Promise<void> {
    const execute = async (mgr: EntityManager) => {
      const plan = await mgr.findOne(ContractInvoicePlan, {
        where: { id: planId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!plan) return;

      const rows = await mgr
        .createQueryBuilder(InvoicePlanAllocation, 'allocation')
        .innerJoinAndSelect('allocation.invoice', 'invoice')
        .where('allocation.plan_id = :planId', { planId })
        .setLock('pessimistic_write')
        .getMany();

      const effective = rows.filter(
        row => row.invoice && row.invoice.status !== 'cancelled'
      );

      const actual = effective.reduce(
        (sum, row) => sum + Number(row.allocated_amount || 0),
        0
      );
      plan.actual_invoiced_amount = Number(actual.toFixed(2));

      if (
        effective.length > 0 &&
        effective.every(row => row.invoice.status === 'bad_debt')
      ) {
        plan.status = 'bad_debt';
      } else if (actual <= 0) {
        plan.status = 'pending';
      } else if (actual + AMOUNT_EPSILON < Number(plan.planned_amount || 0)) {
        plan.status = 'partial_invoiced';
      } else {
        plan.status = 'invoiced';
      }

      await mgr.save(ContractInvoicePlan, plan);
    };

    if (manager) {
      await execute(manager);
    } else {
      await this.dataSource.transaction(execute);
    }
  }

  /**
   * 计划是否已被任何发票关联（含作废发票，作废票需先处理才能删计划）
   */
  async countAllocationsForPlan(planId: number): Promise<number> {
    return this.allocationRepository.count({ where: { plan_id: planId } });
  }

  /**
   * 查询某张发票涉及的计划 ID（删票前调用，删后用于重算）
   */
  async getPlanIdsForInvoice(
    invoiceId: number,
    manager?: EntityManager
  ): Promise<number[]> {
    const repo = manager
      ? manager.getRepository(InvoicePlanAllocation)
      : this.allocationRepository;
    const rows = await repo.find({
      where: { invoice_id: invoiceId },
      select: ['plan_id'],
    });
    return [...new Set(rows.map(row => row.plan_id))];
  }

  // ---------------------------------------------------------------- 内部方法

  private async lockPlan(
    manager: EntityManager,
    planId: number
  ): Promise<ContractInvoicePlan> {
    const plan = await manager.findOne(ContractInvoicePlan, {
      where: { id: planId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!plan) throw new Error('开票计划不存在');
    return plan;
  }

  private assertPlanBelongs(
    plan: ContractInvoicePlan,
    contractId: number,
    kitId: number
  ): void {
    if (plan.contract_id !== contractId) {
      throw new Error('开票计划不属于该合同');
    }
    if (plan.kit_id !== kitId) {
      throw new Error('开票计划不属于当前套账');
    }
  }

  /**
   * 校验金额为正、去重、规整为两位小数
   */
  private normalizeAllocations<T extends { allocated_amount: number }>(
    items: T[],
    key: 'plan_id' | 'invoice_id'
  ): T[] {
    const seen = new Set<number>();
    return items.map(item => {
      const raw = Number(item.allocated_amount);
      if (!Number.isFinite(raw) || raw <= 0) {
        throw new Error('分摊金额必须大于 0');
      }
      const id = Number((item as any)[key]);
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error('分摊对象 ID 不合法');
      }
      if (seen.has(id)) {
        throw new Error(
          '同一张发票不能重复分摊到同一计划，或同一计划不能重复选择同一张发票'
        );
      }
      seen.add(id);
      return {
        ...item,
        [key]: id,
        allocated_amount: Number(raw.toFixed(2)),
      } as T;
    });
  }

  /**
   * 计划侧保存时，逐张校验「该发票在全部计划（含本计划本次提交）上的分摊合计」不超发票总额
   */
  private async assertInvoiceTotals(
    invoiceMap: Map<number, Invoice>,
    items: Array<{ invoice_id: number; allocated_amount: number }>,
    manager: EntityManager,
    planId: number
  ): Promise<void> {
    const incoming = new Map<number, number>();
    items.forEach(item => {
      incoming.set(item.invoice_id, item.allocated_amount);
    });

    const invoiceIds = [...incoming.keys()];
    if (invoiceIds.length === 0) return;

    // 其它计划上已占用的额度（排除本计划，本计划以本次提交为准）
    const others = await manager
      .createQueryBuilder(InvoicePlanAllocation, 'allocation')
      .select('allocation.invoice_id', 'invoice_id')
      .addSelect('SUM(allocation.allocated_amount)', 'allocated')
      .where('allocation.invoice_id IN (:...invoiceIds)', { invoiceIds })
      .andWhere('allocation.plan_id <> :planId', { planId })
      .groupBy('allocation.invoice_id')
      .getRawMany();

    const usedElsewhere = new Map<number, number>();
    others.forEach(row => {
      usedElsewhere.set(Number(row.invoice_id), Number(row.allocated) || 0);
    });

    for (const [invoiceId, amount] of incoming) {
      const invoice = invoiceMap.get(invoiceId);
      if (!invoice) continue;
      const used = usedElsewhere.get(invoiceId) ?? 0;
      const total = Number((used + amount).toFixed(2));
      const cap = Number(invoice.total_amount);
      if (total > cap + AMOUNT_EPSILON) {
        const remaining = Math.max(0, Number((cap - used).toFixed(2)));
        throw new Error(
          `发票 ${invoice.invoice_number} 分摊合计 ¥${total.toFixed(
            2
          )} 超过发票总额 ¥${cap.toFixed(
            2
          )}，该票剩余可分摊 ¥${remaining.toFixed(2)}`
        );
      }
    }
  }
}
