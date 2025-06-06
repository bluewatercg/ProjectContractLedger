import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entity/invoice.entity';
import { CreateInvoiceDto, UpdateInvoiceDto, PaginationQuery, PaginationResult } from '../interface';

@Provide()
export class InvoiceService {
  @InjectEntityModel(Invoice)
  invoiceRepository: Repository<Invoice>;

  /**
   * 创建发票
   */
  async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    // 生成发票编号
    const invoiceNumber = await this.generateInvoiceNumber();
    
    // 计算税额和总额
    const { amount, tax_rate = 0 } = createInvoiceDto;
    const tax_amount = amount * (tax_rate / 100);
    const total_amount = amount + tax_amount;
    
    const invoice = this.invoiceRepository.create({
      ...createInvoiceDto,
      invoice_number: invoiceNumber,
      tax_amount,
      total_amount
    });
    
    return await this.invoiceRepository.save(invoice);
  }

  /**
   * 获取发票列表（分页）
   */
  async getInvoices(query: PaginationQuery & { contractId?: number; status?: string }): Promise<PaginationResult<Invoice>> {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC', contractId, status } = query;
    
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.contract', 'contract')
      .leftJoinAndSelect('contract.customer', 'customer');
    
    // 过滤条件
    if (contractId) {
      queryBuilder.andWhere('invoice.contract_id = :contractId', { contractId });
    }
    
    if (status) {
      queryBuilder.andWhere('invoice.status = :status', { status });
    }
    
    // 排序
    queryBuilder.orderBy(`invoice.${sortBy}`, sortOrder);
    
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
   * 根据ID获取发票
   */
  async getInvoiceById(id: number): Promise<Invoice | null> {
    return await this.invoiceRepository.findOne({
      where: { id },
      relations: ['contract', 'contract.customer', 'payments']
    });
  }

  /**
   * 更新发票
   */
  async updateInvoice(id: number, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice | null> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    
    if (!invoice) {
      return null;
    }
    
    // 如果更新了金额或税率，重新计算
    if (updateInvoiceDto.amount !== undefined || updateInvoiceDto.tax_rate !== undefined) {
      const amount = updateInvoiceDto.amount ?? invoice.amount;
      const tax_rate = updateInvoiceDto.tax_rate ?? invoice.tax_rate;
      const tax_amount = amount * (tax_rate / 100);
      const total_amount = amount + tax_amount;
      
      updateInvoiceDto.tax_amount = tax_amount;
      updateInvoiceDto.total_amount = total_amount;
    }
    
    Object.assign(invoice, updateInvoiceDto);
    return await this.invoiceRepository.save(invoice);
  }

  /**
   * 删除发票
   */
  async deleteInvoice(id: number): Promise<boolean> {
    const result = await this.invoiceRepository.delete(id);
    return result.affected > 0;
  }

  /**
   * 生成发票编号
   */
  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // 查找当月最大编号
    const prefix = `INV${year}${month}`;
    const lastInvoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoice_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('invoice.invoice_number', 'DESC')
      .getOne();
    
    let sequence = 1;
    if (lastInvoice) {
      const lastNumber = lastInvoice.invoice_number.substring(prefix.length);
      sequence = parseInt(lastNumber) + 1;
    }
    
    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * 获取发票统计信息
   */
  async getInvoiceStats(): Promise<any> {
    const total = await this.invoiceRepository.count();
    const draft = await this.invoiceRepository.count({ where: { status: 'draft' } });
    const sent = await this.invoiceRepository.count({ where: { status: 'sent' } });
    const paid = await this.invoiceRepository.count({ where: { status: 'paid' } });
    const overdue = await this.invoiceRepository.count({ where: { status: 'overdue' } });
    
    // 计算总金额
    const totalAmountResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.total_amount)', 'total')
      .getRawOne();
    
    // 计算已付金额
    const paidAmountResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.total_amount)', 'total')
      .where('invoice.status = :status', { status: 'paid' })
      .getRawOne();
    
    // 计算未付金额
    const unpaidAmountResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.total_amount)', 'total')
      .where('invoice.status IN (:...statuses)', { statuses: ['sent', 'overdue'] })
      .getRawOne();
    
    return {
      total,
      draft,
      sent,
      paid,
      overdue,
      totalAmount: parseFloat(totalAmountResult.total) || 0,
      paidAmount: parseFloat(paidAmountResult.total) || 0,
      unpaidAmount: parseFloat(unpaidAmountResult.total) || 0
    };
  }

  /**
   * 获取逾期发票
   */
  async getOverdueInvoices(): Promise<Invoice[]> {
    const today = new Date();
    return await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.contract', 'contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .where('invoice.due_date < :today', { today })
      .andWhere('invoice.status IN (:...statuses)', { statuses: ['sent', 'overdue'] })
      .orderBy('invoice.due_date', 'ASC')
      .getMany();
  }
}
