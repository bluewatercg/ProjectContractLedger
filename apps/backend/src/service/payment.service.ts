import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel, InjectDataSource } from '@midwayjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Payment } from '../entity/payment.entity';
import { Invoice } from '../entity/invoice.entity';
import { Contract } from '../entity/contract.entity';
import { Customer } from '../entity/customer.entity';
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

  @InjectEntityModel(Customer)
  customerRepository: Repository<Customer>;

  @InjectDataSource()
  dataSource: DataSource;

  @Inject()
  statisticsService: any; // 延迟注入避免循环依赖

  /**
   * 格式化支付数据，处理日期字段
   */
  private formatPaymentResponse(payment: any): any {
    const formatted = DateUtil.formatEntityResponse(payment, ['payment_date']);
    if (payment.payer_customer) {
      formatted.payer_customer = payment.payer_customer;
    }
    return formatted;
  }

  /**
   * 获取发票对应的合同客户ID（用于默认付款方）
   */
  private async getContractCustomerId(
    invoiceId: number
  ): Promise<number | null> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['contract'],
    });
    return invoice?.contract?.customer_id ?? null;
  }

  /**
   * 校验客户是否属于同一kit
   */
  private async validateCustomerInKit(
    customerId: number,
    kitId: number
  ): Promise<boolean> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, kit_id: kitId },
    });
    return !!customer;
  }

  /**
   * 锁定发票并校验作废终态（事务内使用）
   */
  private async lockInvoiceOrThrow(
    manager: EntityManager,
    invoiceId: number,
    kitId: number
  ): Promise<Invoice> {
    const invoice = await manager.findOne(Invoice, {
      where: { id: invoiceId, kit_id: kitId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!invoice) {
      throw new Error('发票不存在');
    }
    if (invoice.status === 'cancelled') {
      throw new Error('该发票已作废，无法操作');
    }
    return invoice;
  }

  /**
   * 根据ID获取发票信息
   */
  async getInvoiceById(invoiceId: number): Promise<Invoice | null> {
    return await this.invoiceRepository.findOne({
      where: { id: invoiceId },
    });
  }

  /**
   * 创建支付记录
   */
  async createPayment(
    createPaymentDto: CreatePaymentDto & { payer_customer_id?: number },
    kitId: number
  ): Promise<any> {
    if (!kitId) {
      throw new Error('kitId 不能为空');
    }

    return await this.dataSource.transaction(async manager => {
      // 锁定发票并校验终态
      await this.lockInvoiceOrThrow(
        manager,
        createPaymentDto.invoice_id,
        kitId
      );

      // 默认付款方为合同客户
      let payerCustomerId = createPaymentDto.payer_customer_id ?? null;
      if (payerCustomerId == null) {
        payerCustomerId = await this.getContractCustomerId(
          createPaymentDto.invoice_id
        );
      }

      // 同kit校验
      if (payerCustomerId != null) {
        const valid = await this.validateCustomerInKit(payerCustomerId, kitId);
        if (!valid) {
          throw new Error('付款方客户不属于当前套账');
        }
      }

      // 显式字段白名单，防止 raw body 注入
      const payment = this.paymentRepository.create({
        invoice_id: createPaymentDto.invoice_id,
        amount: createPaymentDto.amount,
        payment_date: DateUtil.parseDate(createPaymentDto.payment_date),
        payment_method: createPaymentDto.payment_method,
        reference_number: createPaymentDto.reference_number,
        notes: createPaymentDto.notes,
        payer_customer_id: payerCustomerId,
        kit_id: kitId,
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

      // 重新加载带关系的记录用于返回
      const fullPayment = await manager.findOne(Payment, {
        where: { id: savedPayment.id },
        relations: ['payer_customer'],
      });
      return this.formatPaymentResponse(fullPayment || savedPayment);
    });
  }

  /**
   * 获取支付记录列表（分页）
   */
  async getPayments(
    query: PaginationQuery & { invoiceId?: number; status?: string },
    kitId?: number
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
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('payment.payer_customer', 'payer_customer');

    // 按kit_id过滤
    if (kitId) {
      queryBuilder.where('payment.kit_id = :kitId', { kitId });
    }

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
  async getPaymentById(id: number, kitId?: number): Promise<Payment | null> {
    const whereCondition: any = { id };
    if (kitId) {
      whereCondition.kit_id = kitId;
    }

    return await this.paymentRepository.findOne({
      where: whereCondition,
      relations: [
        'invoice',
        'invoice.contract',
        'invoice.contract.customer',
        'payer_customer',
      ],
    });
  }

  /**
   * 更新支付记录
   */
  async updatePayment(
    id: number,
    updatePaymentDto: UpdatePaymentDto & { payer_customer_id?: number },
    kitId: number
  ): Promise<Payment | null> {
    if (!kitId) {
      throw new Error('kitId 不能为空');
    }
    return await this.dataSource.transaction(async manager => {
      // 先通过payment找到invoice_id并锁定
      const whereCondition: any = { id };
      if (kitId) {
        whereCondition.kit_id = kitId;
      }

      const payment = await manager.findOne(Payment, { where: whereCondition });

      if (!payment) {
        return null;
      }

      // 锁定发票并校验终态
      await this.lockInvoiceOrThrow(manager, payment.invoice_id, kitId);

      // 锁后重新读取 payment，避免并发 delete 后旧 payment save 复活
      const currentPayment = await manager.findOne(Payment, {
        where: { id, kit_id: kitId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!currentPayment) {
        return null;
      }

      // 如果 DTO 包含 invoice_id，必须与原值一致
      if (
        updatePaymentDto.invoice_id !== undefined &&
        updatePaymentDto.invoice_id !== currentPayment.invoice_id
      ) {
        throw new Error('不允许修改发票ID');
      }

      // 同kit校验（如果修改了payer_customer_id）
      if (updatePaymentDto.payer_customer_id != null) {
        const valid = await this.validateCustomerInKit(
          updatePaymentDto.payer_customer_id,
          kitId
        );
        if (!valid) {
          throw new Error('付款方客户不属于当前套账');
        }
        currentPayment.payer_customer_id = updatePaymentDto.payer_customer_id;
      }

      // 显式字段白名单
      const allowedFields = [
        'amount',
        'payment_date',
        'payment_method',
        'reference_number',
        'status',
        'notes',
        'payer_customer_id',
      ];
      for (const field of allowedFields) {
        if (updatePaymentDto[field] !== undefined) {
          Object.assign(currentPayment, { [field]: updatePaymentDto[field] });
        }
      }
      const updatedPayment = await manager.save(currentPayment);

      // 如果支付金额或状态发生变化，更新发票状态
      if (
        updatePaymentDto.amount !== undefined ||
        updatePaymentDto.status !== undefined
      ) {
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

      // 重新加载带关系的记录用于返回
      const fullPayment = await manager.findOne(Payment, {
        where: { id: updatedPayment.id },
        relations: ['payer_customer'],
      });
      return fullPayment || updatedPayment;
    });
  }

  /**
   * 删除支付记录
   */
  async deletePayment(id: number, kitId: number): Promise<boolean> {
    if (!kitId) {
      throw new Error('kitId 不能为空');
    }
    return await this.dataSource.transaction(async manager => {
      const payment = await manager.findOne(Payment, {
        where: { id, kit_id: kitId },
      });
      if (!payment) {
        return false;
      }

      // 锁定发票并校验终态
      await this.lockInvoiceOrThrow(manager, payment.invoice_id, kitId);

      // 锁后重新读取 payment，避免并发操作后使用过期数据
      const currentPayment = await manager.findOne(Payment, {
        where: { id, kit_id: kitId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!currentPayment) {
        return false;
      }

      const result = await manager.delete(Payment, { id, kit_id: kitId });

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
    manager: EntityManager,
    invoiceId: number
  ): Promise<void> {
    const invoice = await manager.findOne(Invoice, {
      where: { id: invoiceId },
    });

    if (!invoice) {
      return;
    }

    // 作废发票状态不可变
    if (invoice.status === 'cancelled') {
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
    manager: EntityManager,
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
   * 完成条件：
   * 1. 合同到期日已过
   * 2. 合同下所有发票都为paid状态
   * 3. 发票总额达到或超过合同金额
   */
  private async shouldCompleteContractWithManager(
    manager: EntityManager,
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

    // 检查合同是否已到期（新增条件）
    if (contract.end_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 只比较日期部分
      const endDate = new Date(contract.end_date);
      endDate.setHours(0, 0, 0, 0);

      if (endDate > today) {
        // 合同未到期，不自动完成（让合同保持active状态便于续签提醒等功能）
        return false;
      }
    }

    // 排除已作废的发票
    const activeInvoices = contract.invoices.filter(
      invoice => invoice.status !== 'cancelled'
    );

    // 检查所有有效发票是否都已付款
    const allInvoicesPaid = activeInvoices.every(
      invoice => invoice.status === 'paid'
    );

    if (!allInvoicesPaid) {
      return false;
    }

    // 计算有效发票总额（排除已作废）
    const totalInvoiceAmount = activeInvoices.reduce((sum, invoice) => {
      return sum + parseFloat(invoice.total_amount.toString());
    }, 0);

    // 检查发票总额是否达到或超过合同金额
    const contractAmount = parseFloat(contract.total_amount.toString());

    return totalInvoiceAmount >= contractAmount;
  }

  /**
   * 获取支付统计信息（优化版本）
   */
  async getPaymentStats(year?: number, kitId?: number): Promise<any> {
    // 基础统计信息
    const basicStatsQueryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoin('payment.invoice', 'invoice')
      .select([
        'COUNT(*) as total',
        "SUM(CASE WHEN payment.status = 'completed' THEN 1 ELSE 0 END) as completed",
        "SUM(CASE WHEN payment.status = 'pending' THEN 1 ELSE 0 END) as pending",
        "SUM(CASE WHEN payment.status = 'failed' THEN 1 ELSE 0 END) as failed",
        "SUM(CASE WHEN payment.status = 'completed' THEN payment.amount ELSE 0 END) as totalAmount",
      ])
      .where("invoice.status <> 'cancelled'");

    if (kitId) {
      basicStatsQueryBuilder.andWhere('payment.kit_id = :kitId', { kitId });
    }

    if (year) {
      basicStatsQueryBuilder.andWhere('YEAR(payment.payment_date) = :year', {
        year,
      });
    }

    const basicStats = await basicStatsQueryBuilder.getRawOne();

    // 按支付方式统计
    const paymentMethodQueryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoin('payment.invoice', 'invoice')
      .select('payment.payment_method', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'amount')
      .where('payment.status = :status', { status: 'completed' })
      .andWhere("invoice.status <> 'cancelled'");

    if (kitId) {
      paymentMethodQueryBuilder.andWhere('payment.kit_id = :kitId', { kitId });
    }

    if (year) {
      paymentMethodQueryBuilder.andWhere('YEAR(payment.payment_date) = :year', {
        year,
      });
    }

    const paymentMethodStats = await paymentMethodQueryBuilder
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
