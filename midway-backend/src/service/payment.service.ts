import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entity/payment.entity';
import { Invoice } from '../entity/invoice.entity';
import { CreatePaymentDto, UpdatePaymentDto, PaginationQuery, PaginationResult } from '../interface';

@Provide()
export class PaymentService {
  @InjectEntityModel(Payment)
  paymentRepository: Repository<Payment>;

  @InjectEntityModel(Invoice)
  invoiceRepository: Repository<Invoice>;

  /**
   * 创建支付记录
   */
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const payment = this.paymentRepository.create(createPaymentDto);
    const savedPayment = await this.paymentRepository.save(payment);
    
    // 更新发票状态
    await this.updateInvoiceStatus(createPaymentDto.invoice_id);
    
    return savedPayment;
  }

  /**
   * 获取支付记录列表（分页）
   */
  async getPayments(query: PaginationQuery & { invoiceId?: number; status?: string }): Promise<PaginationResult<Payment>> {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC', invoiceId, status } = query;
    
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment')
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
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 根据ID获取支付记录
   */
  async getPaymentById(id: number): Promise<Payment | null> {
    return await this.paymentRepository.findOne({
      where: { id },
      relations: ['invoice', 'invoice.contract', 'invoice.contract.customer']
    });
  }

  /**
   * 更新支付记录
   */
  async updatePayment(id: number, updatePaymentDto: UpdatePaymentDto): Promise<Payment | null> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    
    if (!payment) {
      return null;
    }
    
    Object.assign(payment, updatePaymentDto);
    const updatedPayment = await this.paymentRepository.save(payment);
    
    // 如果支付金额发生变化，更新发票状态
    if (updatePaymentDto.amount !== undefined) {
      await this.updateInvoiceStatus(payment.invoice_id);
    }
    
    return updatedPayment;
  }

  /**
   * 删除支付记录
   */
  async deletePayment(id: number): Promise<boolean> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      return false;
    }
    
    const result = await this.paymentRepository.delete(id);
    
    // 更新发票状态
    if (result.affected > 0) {
      await this.updateInvoiceStatus(payment.invoice_id);
    }
    
    return result.affected > 0;
  }

  /**
   * 根据发票ID获取支付记录
   */
  async getPaymentsByInvoiceId(invoiceId: number): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { invoice_id: invoiceId },
      order: { payment_date: 'DESC' }
    });
  }

  /**
   * 更新发票支付状态
   */
  private async updateInvoiceStatus(invoiceId: number): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId }
    });
    
    if (!invoice) {
      return;
    }
    
    // 计算已支付总额
    const paymentsResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.invoice_id = :invoiceId', { invoiceId })
      .andWhere('payment.status = :status', { status: 'completed' })
      .getRawOne();
    
    const totalPaid = parseFloat(paymentsResult.total) || 0;
    
    // 更新发票状态
    let newStatus = invoice.status;
    if (totalPaid >= invoice.total_amount) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'sent'; // 部分支付
    } else {
      // 检查是否逾期
      const today = new Date();
      if (invoice.due_date < today && invoice.status === 'sent') {
        newStatus = 'overdue';
      }
    }
    
    if (newStatus !== invoice.status) {
      await this.invoiceRepository.update(invoiceId, { status: newStatus });
    }
  }

  /**
   * 获取支付统计信息
   */
  async getPaymentStats(): Promise<any> {
    const total = await this.paymentRepository.count();
    const completed = await this.paymentRepository.count({ where: { status: 'completed' } });
    const pending = await this.paymentRepository.count({ where: { status: 'pending' } });
    const failed = await this.paymentRepository.count({ where: { status: 'failed' } });
    
    // 计算总支付金额
    const totalAmountResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: 'completed' })
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
      total,
      completed,
      pending,
      failed,
      totalAmount: parseFloat(totalAmountResult.total) || 0,
      paymentMethodStats
    };
  }
}
