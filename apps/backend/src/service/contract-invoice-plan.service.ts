import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel, InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ContractInvoicePlan } from '../entity/contract-invoice-plan.entity';
import { InvoicePlanAllocation } from '../entity/invoice-plan-allocation.entity';
import { CreateContractInvoicePlanDto } from '../interface.contract-invoice-plan';

@Provide()
export class ContractInvoicePlanService {
  @InjectEntityModel(ContractInvoicePlan)
  planRepository: Repository<ContractInvoicePlan>;

  @InjectDataSource()
  dataSource: DataSource;

  @Inject()
  statisticsService: any; // 如需后续做报表缓存，可复用统计服务

  @Inject()
  invoicePlanAllocationService: any;

  /**
   * 根据合同查询所有开票计划
   */
  async getPlansByContract(
    contractId: number,
    kitId?: number
  ): Promise<ContractInvoicePlan[]> {
    const where: any = { contract_id: contractId };
    if (kitId) {
      where.kit_id = kitId;
    }
    return this.planRepository.find({
      where,
      order: { id: 'ASC' },
    });
  }

  /**
   * 批量保存合同下的开票计划
   * - 有 id: 更新
   * - 无 id: 新增
   * - 旧有且未出现在传入列表中: 尝试删除（如已关联发票则报错）
   */
  async savePlansForContract(
    contractId: number,
    kitId: number,
    plans: CreateContractInvoicePlanDto[]
  ): Promise<void> {
    await this.dataSource.transaction(async manager => {
      const planRepo = manager.getRepository(ContractInvoicePlan);
      const allocationRepo = manager.getRepository(InvoicePlanAllocation);

      const existingPlans = await planRepo.find({
        where: { contract_id: contractId, kit_id: kitId },
      });

      const existingMap = new Map<number, ContractInvoicePlan>();
      existingPlans.forEach(p => existingMap.set(p.id, p));

      const incomingIds = new Set<number>();

      // upsert
      for (const dto of plans) {
        if (dto.id && existingMap.has(dto.id)) {
          // update
          const entity = existingMap.get(dto.id)!;
          if (dto.phase_name !== undefined) {
            entity.phase_name = dto.phase_name;
          }
          if (dto.pay_ratio !== undefined) {
            entity.pay_ratio = dto.pay_ratio;
          }
          if (dto.planned_amount !== undefined) {
            entity.planned_amount = dto.planned_amount;
          }
          if (dto.planned_invoice_date !== undefined) {
            entity.planned_invoice_date = dto.planned_invoice_date || null;
          }
          if (dto.remind_days_before !== undefined) {
            entity.remind_days_before = dto.remind_days_before;
          }
          await planRepo.save(entity);
          incomingIds.add(dto.id);
        } else {
          // create
          const entity = planRepo.create({
            contract_id: contractId,
            kit_id: kitId,
            phase_name: dto.phase_name,
            pay_ratio: dto.pay_ratio ?? 0,
            planned_amount: dto.planned_amount,
            planned_invoice_date: dto.planned_invoice_date || null,
            remind_days_before: dto.remind_days_before ?? 0,
          });
          const saved = await planRepo.save(entity);
          if (dto.id) {
            incomingIds.add(saved.id);
          }
        }
      }

      // delete removed ones (if not bound to invoices)
      for (const old of existingPlans) {
        if (!incomingIds.has(old.id)) {
          const count = await allocationRepo.count({
            where: { plan_id: old.id },
          });
          if (count > 0) {
            throw new Error(
              `计划「${old.phase_name}」已分摊发票，无法删除，请先解除分摊后再删除计划。`
            );
          }
          await planRepo.delete(old.id);
        }
      }

      // 可选：这里可以做 pay_ratio 合计检查（只警告不阻塞），目前先交给前端校验
    });
  }

  /**
   * 删除单条计划（仅在未关联发票时允许）
   */
  async deletePlan(planId: number, kitId?: number): Promise<boolean> {
    return await this.dataSource.transaction(async manager => {
      const planRepo = manager.getRepository(ContractInvoicePlan);
      const allocationRepo = manager.getRepository(InvoicePlanAllocation);

      const where: any = { id: planId };
      if (kitId) {
        where.kit_id = kitId;
      }

      const plan = await planRepo.findOne({ where });
      if (!plan) {
        return false;
      }

      const count = await allocationRepo.count({ where: { plan_id: plan.id } });
      if (count > 0) {
        throw new Error('该开票计划已分摊发票，无法删除，请先解除分摊');
      }

      const result = await planRepo.delete(plan.id);
      return result.affected > 0;
    });
  }

  /**
   * 重新计算计划的实际开票金额和状态
   * 委托给 InvoicePlanAllocationService，保证与发票侧共用同一套口径
   */
  async recalcPlanAmountAndStatus(
    planId: number,
    manager?: EntityManager
  ): Promise<void> {
    await this.invoicePlanAllocationService.recalcPlan(planId, manager);
  }

  /**
   * 获取即将到期的开票计划提醒列表
   * 条件：planned_invoice_date 不为空、status 不是 invoiced/cancelled
   * 且 planned_invoice_date - remind_days_before <= 今天 + lookAheadDays
   */
  async getReminders(
    kitId?: number,
    lookAheadDays?: number
  ): Promise<ContractInvoicePlan[]> {
    const qb = this.planRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.contract', 'contract')
      .where('plan.planned_invoice_date IS NOT NULL')
      .andWhere('plan.status NOT IN (:...excludeStatus)', {
        excludeStatus: ['invoiced', 'cancelled'],
      });

    if (kitId) {
      qb.andWhere('plan.kit_id = :kitId', { kitId });
    }

    // 提醒窗口：planned_invoice_date - remind_days_before <= 今天 + lookAheadDays
    // 即 DATE_SUB(planned_invoice_date, INTERVAL remind_days_before DAY) <= CURDATE() + lookAheadDays
    const ahead = lookAheadDays ?? 0;
    qb.andWhere(
      'DATE_SUB(plan.planned_invoice_date, INTERVAL plan.remind_days_before DAY) <= DATE_ADD(CURDATE(), INTERVAL :ahead DAY)',
      { ahead }
    );

    qb.orderBy('plan.planned_invoice_date', 'ASC');

    return qb.getMany();
  }
}
