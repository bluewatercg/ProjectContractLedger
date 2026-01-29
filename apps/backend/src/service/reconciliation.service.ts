import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Reconciliation } from '../entity/reconciliation.entity';
import { ReconciliationDetail } from '../entity/reconciliation-detail.entity';
import { Invoice } from '../entity/invoice.entity';
import { Payment } from '../entity/payment.entity';
import { Context } from '@midwayjs/koa';

@Provide()
export class ReconciliationService {
  @InjectEntityModel(Reconciliation)
  reconciliationRepository: Repository<Reconciliation>;

  @InjectEntityModel(ReconciliationDetail)
  reconciliationDetailRepository: Repository<ReconciliationDetail>;

  @InjectEntityModel(Invoice)
  invoiceRepository: Repository<Invoice>;

  @InjectEntityModel(Payment)
  paymentRepository: Repository<Payment>;

  @Inject()
  ctx: Context;

  /**
   * 生成对账单号
   */
  private generateReconciliationNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `REC-${year}${month}${day}-${random}`;
  }

  /**
   * 自动对账 - 单张发票
   */
  async autoReconcile(invoiceId: number, userId: number, kitId: number): Promise<Reconciliation> {
    // 1. 获取发票信息及其支付记录
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, kit_id: kitId },
      relations: ['payments'],
    });

    if (!invoice) {
      throw new Error('发票不存在');
    }

    // 2. 计算已支付总额（只计算已完成的支付）
    const paidAmount = invoice.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // 3. 计算差异
    const invoiceAmount = Number(invoice.total_amount);
    const difference = Math.abs(invoiceAmount - paidAmount);

    // 4. 判断对账状态
    let status: string;
    if (difference === 0) {
      status = 'matched'; // 完全匹配
    } else if (paidAmount === 0) {
      status = 'unmatched'; // 未支付
    } else if (paidAmount < invoiceAmount) {
      status = 'underpaid'; // 少付
    } else if (paidAmount > invoiceAmount) {
      status = 'overpaid'; // 多付
    } else {
      status = 'partial'; // 部分支付
    }

    // 5. 检查是否已存在对账记录
    const existingReconciliation = await this.reconciliationRepository.findOne({
      where: { invoice_id: invoiceId, kit_id: kitId },
    });

    let reconciliation: Reconciliation;

    if (existingReconciliation) {
      // 更新现有对账记录
      existingReconciliation.invoice_amount = invoiceAmount;
      existingReconciliation.paid_amount = paidAmount;
      existingReconciliation.difference_amount = difference;
      existingReconciliation.status = status;
      existingReconciliation.reconciled_by = userId;
      existingReconciliation.reconciled_at = new Date();

      reconciliation = await this.reconciliationRepository.save(
        existingReconciliation
      );

      // 删除旧的对账明细
      await this.reconciliationDetailRepository.delete({
        reconciliation_id: reconciliation.id,
      });
    } else {
      // 创建新的对账记录
      reconciliation = new Reconciliation();
      reconciliation.kit_id = kitId;
      reconciliation.reconciliation_number = this.generateReconciliationNumber();
      reconciliation.invoice_id = invoiceId;
      reconciliation.invoice_amount = invoiceAmount;
      reconciliation.paid_amount = paidAmount;
      reconciliation.difference_amount = difference;
      reconciliation.status = status;
      reconciliation.reconciled_by = userId;
      reconciliation.reconciled_at = new Date();

      reconciliation = await this.reconciliationRepository.save(reconciliation);
    }

    // 6. 创建对账明细
    for (const payment of invoice.payments.filter(
      p => p.status === 'completed'
    )) {
      const detail = new ReconciliationDetail();
      detail.reconciliation_id = reconciliation.id;
      detail.payment_id = payment.id;
      detail.payment_amount = Number(payment.amount);
      detail.payment_date = payment.payment_date;
      detail.payment_method = payment.payment_method;
      detail.reference_number = payment.reference_number;
      detail.is_matched = true;

      await this.reconciliationDetailRepository.save(detail);
    }

    // 7. 如果完全匹配，自动更新发票状态为已支付
    if (status === 'matched' && invoice.status !== 'paid') {
      invoice.status = 'paid';
      await this.invoiceRepository.save(invoice);
    }

    return reconciliation;
  }

  /**
   * 批量自动对账
   */
  async batchAutoReconcile(
    invoiceIds: number[],
    userId: number,
    kitId: number
  ): Promise<{ success: number; failed: number; results: any[] }> {
    const results = [];
    let success = 0;
    let failed = 0;

    for (const invoiceId of invoiceIds) {
      try {
        const reconciliation = await this.autoReconcile(invoiceId, userId, kitId);
        results.push({
          invoiceId,
          success: true,
          reconciliation,
        });
        success++;
      } catch (error) {
        results.push({
          invoiceId,
          success: false,
          error: error.message,
        });
        failed++;
      }
    }

    return { success, failed, results };
  }

  /**
   * 手动对账
   */
  async manualReconcile(data: {
    invoiceId: number;
    paymentIds: number[];
    differenceReason?: string;
    notes?: string;
    userId: number;
    kitId: number;
  }): Promise<Reconciliation> {
    // 1. 获取发票信息
    const invoice = await this.invoiceRepository.findOne({
      where: { id: data.invoiceId, kit_id: data.kitId },
    });

    if (!invoice) {
      throw new Error('发票不存在');
    }

    // 2. 获取选中的支付记录
    const payments = await this.paymentRepository.findByIds(data.paymentIds);

    if (payments.length !== data.paymentIds.length) {
      throw new Error('部分支付记录不存在');
    }

    // 3. 计算已支付总额
    const paidAmount = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    // 4. 计算差异
    const invoiceAmount = Number(invoice.total_amount);
    const difference = Math.abs(invoiceAmount - paidAmount);

    // 5. 判断对账状态
    let status: string;
    if (difference === 0) {
      status = 'matched';
    } else if (paidAmount === 0) {
      status = 'unmatched';
    } else if (paidAmount < invoiceAmount) {
      status = 'underpaid';
    } else {
      status = 'overpaid';
    }

    // 6. 创建对账记录
    const reconciliation = new Reconciliation();
    reconciliation.kit_id = data.kitId;
    reconciliation.reconciliation_number = this.generateReconciliationNumber();
    reconciliation.invoice_id = data.invoiceId;
    reconciliation.invoice_amount = invoiceAmount;
    reconciliation.paid_amount = paidAmount;
    reconciliation.difference_amount = difference;
    reconciliation.status = status;
    reconciliation.difference_reason = data.differenceReason;
    reconciliation.notes = data.notes;
    reconciliation.reconciled_by = data.userId;
    reconciliation.reconciled_at = new Date();

    const savedReconciliation = await this.reconciliationRepository.save(
      reconciliation
    );

    // 7. 创建对账明细
    for (const payment of payments) {
      const detail = new ReconciliationDetail();
      detail.reconciliation_id = savedReconciliation.id;
      detail.payment_id = payment.id;
      detail.payment_amount = Number(payment.amount);
      detail.payment_date = payment.payment_date;
      detail.payment_method = payment.payment_method;
      detail.reference_number = payment.reference_number;
      detail.is_matched = true;

      await this.reconciliationDetailRepository.save(detail);
    }

    return savedReconciliation;
  }

  /**
   * 获取对账列表
   */
  async getReconciliations(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    approvalStatus?: string;
    startDate?: string;
    endDate?: string;
    kitId: number;
  }): Promise<{ items: Reconciliation[]; total: number }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;

    const queryBuilder = this.reconciliationRepository
      .createQueryBuilder('reconciliation')
      .leftJoinAndSelect('reconciliation.invoice', 'invoice')
      .leftJoinAndSelect('invoice.contract', 'contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('reconciliation.reconciledByUser', 'reconciledByUser')
      .leftJoinAndSelect('reconciliation.details', 'details')
      .where('reconciliation.kit_id = :kitId', { kitId: params.kitId });

    // 状态筛选
    if (params.status) {
      queryBuilder.andWhere('reconciliation.status = :status', {
        status: params.status,
      });
    }

    // 审批状态筛选
    if (params.approvalStatus) {
      queryBuilder.andWhere(
        'reconciliation.approval_status = :approvalStatus',
        { approvalStatus: params.approvalStatus }
      );
    }

    // 日期范围筛选
    if (params.startDate) {
      queryBuilder.andWhere('reconciliation.reconciled_at >= :startDate', {
        startDate: params.startDate,
      });
    }

    if (params.endDate) {
      queryBuilder.andWhere('reconciliation.reconciled_at <= :endDate', {
        endDate: params.endDate,
      });
    }

    // 排序
    queryBuilder.orderBy('reconciliation.created_at', 'DESC');

    // 分页
    const [data, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items: data, total };
  }

  /**
   * 获取对账详情
   */
  async getReconciliationById(id: number, kitId: number): Promise<Reconciliation> {
    const reconciliation = await this.reconciliationRepository.findOne({
      where: { id, kit_id: kitId },
      relations: [
        'invoice',
        'invoice.contract',
        'invoice.contract.customer',
        'details',
        'details.payment',
        'reconciledByUser',
        'approvedByUser',
      ],
    });

    if (!reconciliation) {
      throw new Error('对账记录不存在');
    }

    return reconciliation;
  }

  /**
   * 处理对账差异
   */
  async handleDifference(
    id: number,
    action: 'adjust_invoice' | 'refund' | 'write_off' | 'wait_payment',
    reason: string,
    userId: number,
    kitId: number
  ): Promise<Reconciliation> {
    const reconciliation = await this.reconciliationRepository.findOne({
      where: { id, kit_id: kitId },
      relations: ['invoice'],
    });

    if (!reconciliation) {
      throw new Error('对账记录不存在');
    }

    switch (action) {
      case 'adjust_invoice':
        // 调整发票金额为实际支付金额
        reconciliation.invoice.total_amount = reconciliation.paid_amount;
        await this.invoiceRepository.save(reconciliation.invoice);
        reconciliation.status = 'matched';
        reconciliation.difference_amount = 0;
        break;

      case 'refund':
        // 创建退款记录（这里需要调用支付服务创建负数支付记录）
        // TODO: 实现退款逻辑
        reconciliation.status = 'matched';
        break;

      case 'write_off':
        // 核销差异，直接标记为已匹配
        reconciliation.status = 'matched';
        break;

      case 'wait_payment':
        // 等待补款，保持当前状态
        break;
    }

    reconciliation.difference_reason = reason;
    reconciliation.notes = `${reconciliation.notes || ''}\n处理方式: ${action}, 处理人: ${userId}, 时间: ${new Date().toISOString()}`;

    return await this.reconciliationRepository.save(reconciliation);
  }

  /**
   * 审批对账记录
   */
  async approveReconciliation(
    id: number,
    approved: boolean,
    userId: number,
    kitId: number,
    notes?: string
  ): Promise<Reconciliation> {
    const reconciliation = await this.reconciliationRepository.findOne({
      where: { id, kit_id: kitId },
    });

    if (!reconciliation) {
      throw new Error('对账记录不存在');
    }

    reconciliation.approval_status = approved ? 'approved' : 'rejected';
    reconciliation.approved_by = userId;
    reconciliation.approved_at = new Date();

    if (notes) {
      reconciliation.notes = `${reconciliation.notes || ''}\n审批意见: ${notes}`;
    }

    return await this.reconciliationRepository.save(reconciliation);
  }

  /**
   * 获取对账统计数据
   */
  async getReconciliationStats(kitId: number): Promise<any> {
    const stats = await this.reconciliationRepository
      .createQueryBuilder('reconciliation')
      .select('reconciliation.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(reconciliation.difference_amount)', 'totalDifference')
      .where('reconciliation.kit_id = :kitId', { kitId })
      .groupBy('reconciliation.status')
      .getRawMany();

    const totalReconciliations = await this.reconciliationRepository.count({
      where: { kit_id: kitId },
    });

    return {
      total: totalReconciliations,
      byStatus: stats,
    };
  }

  /**
   * 获取待对账发票列表
   */
  async getPendingInvoices(kitId: number): Promise<any[]> {
    // 获取所有已发送但未完全支付的发票
    const invoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.contract', 'contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('invoice.payments', 'payments')
      .where('invoice.kit_id = :kitId', { kitId })
      .andWhere('invoice.status IN (:...statuses)', {
        statuses: ['sent', 'overdue'],
      })
      .getMany();

    // 计算每张发票的支付情况
    const result = invoices.map(invoice => {
      const totalAmount = Number(invoice.total_amount);
      const paidAmount = invoice.payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const remainingAmount = totalAmount - paidAmount;

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customerName: invoice.contract?.customer?.name || '',
        contractNumber: invoice.contract?.contract_number || '',
        totalAmount,
        paidAmount,
        remainingAmount,
        status: invoice.status,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        paymentCount: invoice.payments.length,
      };
    });

    return result;
  }
}
