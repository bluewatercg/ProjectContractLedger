import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel, InjectDataSource } from '@midwayjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment } from '../entity/payment.entity';
import { Invoice } from '../entity/invoice.entity';
import { Contract } from '../entity/contract.entity';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaginationQuery,
  PaginationResult,
} from '../interface';
import { DateUtil } from '../utils/date.util';

@Provide()
export class PaymentService {
  @InjectEntityModel(Payment)
  paymentRepository: Repository<Payment>;

  @InjectEntityModel(Invoice)
  invoiceRepository: Repository<Invoice>;

  @InjectEntityModel(Contract)
  contractRepository: Repository<Contract>;

  @InjectDataSource()
  dataSource: DataSource;

  @Inject()
  statisticsService: any; // 延迟注入避免循环依赖

  /**
   * 格式化支付数据，处理日期字段
   */
  private formatPaymentResponse(payment: Payment): any {
    return DateUtil.formatEntityResponse(payment, ['payment_date']);
  }

  /**
   * 创建支付记录
   */
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<any> {
    return await this.dataSource.transaction(async manager => {
      const payment = this.paymentRepository.create({
        ...createPaymentDto,
        payment_date: DateUtil.parseDate(createPaymentDto.payment_date),
      });
      const savedPayment = await manager.save(payment);

      // 更新发票状态
      await this.updateInvoiceStatusWithManager(
        manager,
        createPaymentDto.invoice_id
      );

      // 检查并更新合同状态
      await this.checkAndUpdateContractStatusWithManager(
        manager,
        createPaymentDto.invoice_id
      );

      // 清除相关缓存
      if (this.statisticsService?.invalidatePaymentCache) {
        this.statisticsService.invalidatePaymentCache();
      }

      // 格式化返回数据，处理日期字段
      return this.formatPaymentResponse(savedPayment);
    });
  }

  /**
   * 获取支付记录列表（分页）
   */
  async getPayments(
    query: PaginationQuery & { invoiceId?: number; status?: string }
  ): Promise<PaginationResult<Payment>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      invoiceId,
      status,
    } = query;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.invoice', 'invoice')
      .leftJoinAndSelect('invoice.contract', 'contract')
      .leftJoinAndSelect('contract.customer', 'customer');

    // 过滤条件
    if (invoiceId) {
      queryBuilder.andWhere('payment.invoice_id = :invoiceId', { invoiceId });
    }

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    // 排序
    queryBuilder.orderBy(`payment.${sortBy}`, sortOrder);

    // 分页
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 根据ID获取支付记录
   */
  async getPaymentById(id: number): Promise<Payment | null> {
    return await this.paymentRepository.findOne({
      where: { id },
      relations: ['invoice', 'invoice.contract', 'invoice.contract.customer'],
    });
  }

  /**
   * 更新支付记录
   */
  async updatePayment(
    id: number,
    updatePaymentDto: UpdatePaymentDto
  ): Promise<Payment | null> {
    return await this.dataSource.transaction(async manager => {
      const payment = await manager.findOne(Payment, { where: { id } });

      if (!payment) {
        return null;
      }

      Object.assign(payment, updatePaymentDto);
      const updatedPayment = await manager.save(payment);

      // 如果支付金额发生变化，更新发票状态
      if (updatePaymentDto.amount !== undefined) {
        await this.updateInvoiceStatusWithManager(manager, payment.invoice_id);
        // 检查并更新合同状态
        await this.checkAndUpdateContractStatusWithManager(
          manager,
          payment.invoice_id
        );
      }

      // 清除相关缓存
      if (this.statisticsService?.invalidatePaymentCache) {
        this.statisticsService.invalidatePaymentCache();
      }

      return updatedPayment;
    });
  }

  /**
   * 删除支付记录
   */
  async deletePayment(id: number): Promise<boolean> {
    return await this.dataSource.transaction(async manager => {
      const payment = await manager.findOne(Payment, { where: { id } });
      if (!payment) {
        return false;
      }

      const result = await manager.delete(Payment, id);

      // 更新发票状态
      if (result.affected > 0) {
        await this.updateInvoiceStatusWithManager(manager, payment.invoice_id);
        // 检查并更新合同状态
        await this.checkAndUpdateContractStatusWithManager(
          manager,
          payment.invoice_id
        );

        // 清除相关缓存
        if (this.statisticsService?.invalidatePaymentCache) {
          this.statisticsService.invalidatePaymentCache();
        }
      }

      return result.affected > 0;
    });
  }

  /**
   * 根据发票ID获取支付记录
   */
  async getPaymentsByInvoiceId(invoiceId: number): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { invoice_id: invoiceId },
      order: { payment_date: 'DESC' },
    });
  }

  /**
   * 更新发票支付状态（带事务管理器）
   */
  private async updateInvoiceStatusWithManager(
    manager: any,
    invoiceId: number
  ): Promise<void> {
    const invoice = await manager.findOne(Invoice, {
      where: { id: invoiceId },
    });

    if (!invoice) {
      return;
    }

    // 计算已支付总额
    const paymentsResult = await manager
      .createQueryBuilder(Payment, 'payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.invoice_id = :invoiceId', { invoiceId })
      .andWhere('payment.status = :status', { status: 'completed' })
      .getRawOne();

    const totalPaid = parseFloat(paymentsResult.total) || 0;

    // 更新发票状态逻辑
    let newStatus = invoice.status;
    if (totalPaid >= invoice.total_amount) {
      // 全额支付，状态变为已付款
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      // 部分支付，状态保持为已发送
      newStatus = 'sent';
    } else {
      // 无支付记录，如果当前是草稿状态则保持，否则保持为已发送
      // 注意：正常情况下发票创建时就应该是sent状态，这里主要处理历史数据
      if (invoice.status === 'draft') {
        newStatus = 'sent'; // 将草稿状态的发票更新为已发送
      }
    }

    if (newStatus !== invoice.status) {
      await manager.update(Invoice, invoiceId, { status: newStatus });
    }
  }

  /**
   * 检查并更新合同状态（带事务管理器）
   */
  private async checkAndUpdateContractStatusWithManager(
    manager: any,
    invoiceId: number
  ): Promise<void> {
    // 获取发票信息
    const invoice = await manager.findOne(Invoice, {
      where: { id: invoiceId },
      relations: ['contract'],
    });

    if (!invoice || !invoice.contract) {
      return;
    }

    const contractId = invoice.contract.id;
    const currentStatus = invoice.contract.status;

    // 如果合同状态为草稿但有发票，先将其更新为执行中
    if (currentStatus === 'draft') {
      await manager.update(Contract, contractId, { status: 'active' });
      // 重新获取更新后的合同信息
      const updatedContract = await manager.findOne(Contract, {
        where: { id: contractId },
      });
      if (updatedContract) {
        invoice.contract.status = updatedContract.status;
      }
    }

    // 检查合同是否应该完成
    const shouldComplete = await this.shouldCompleteContractWithManager(
      manager,
      contractId
    );

    if (
      shouldComplete &&
      (invoice.contract.status === 'active' || currentStatus === 'draft')
    ) {
      await manager.update(Contract, contractId, { status: 'completed' });
    }
  }

  /**
   * 判断合同是否应该完成（带事务管理器）
   * 完成条件：合同下所有发票都为paid状态 且 发票总额达到或超过合同金额
   */
  private async shouldCompleteContractWithManager(
    manager: any,
    contractId: number
  ): Promise<boolean> {
    // 获取合同信息
    const contract = await manager.findOne(Contract, {
      where: { id: contractId },
      relations: ['invoices'],
    });

    if (!contract || !contract.invoices || contract.invoices.length === 0) {
      return false;
    }

    // 检查所有发票是否都已付款
    const allInvoicesPaid = contract.invoices.every(
      invoice => invoice.status === 'paid'
    );

    if (!allInvoicesPaid) {
      return false;
    }

    // 计算发票总额
    const totalInvoiceAmount = contract.invoices.reduce((sum, invoice) => {
      return sum + parseFloat(invoice.total_amount.toString());
    }, 0);

    // 检查发票总额是否达到或超过合同金额
    const contractAmount = parseFloat(contract.total_amount.toString());

    return totalInvoiceAmount >= contractAmount;
  }

  /**
   * 获取支付统计信息（优化版本）
   */
  async getPaymentStats(): Promise<any> {
    // 基础统计信息
    const basicStats = await this.paymentRepository
      .createQueryBuilder('payment')
      .select([
        'COUNT(*) as total',
        "SUM(CASE WHEN payment.status = 'completed' THEN 1 ELSE 0 END) as completed",
        "SUM(CASE WHEN payment.status = 'pending' THEN 1 ELSE 0 END) as pending",
        "SUM(CASE WHEN payment.status = 'failed' THEN 1 ELSE 0 END) as failed",
        "SUM(CASE WHEN payment.status = 'completed' THEN payment.amount ELSE 0 END) as totalAmount",
      ])
      .getRawOne();

    // 按支付方式统计
    const paymentMethodStats = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.payment_method', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'amount')
      .where('payment.status = :status', { status: 'completed' })
      .groupBy('payment.payment_method')
      .getRawMany();

    return {
      total: parseInt(basicStats.total) || 0,
      completed: parseInt(basicStats.completed) || 0,
      pending: parseInt(basicStats.pending) || 0,
      failed: parseInt(basicStats.failed) || 0,
      totalAmount: parseFloat(basicStats.totalAmount) || 0,
      paymentMethodStats,
    };
  }
}
