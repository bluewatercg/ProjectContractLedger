import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice } from '../entity/invoice.entity';
import { Contract } from '../entity/contract.entity';
import { CreateInvoiceDto, UpdateInvoiceDto, PaginationQuery, PaginationResult } from '../interface';
import { DateUtil } from '../utils/date.util';

@Provide()
export class InvoiceService {
  @InjectEntityModel(Invoice)
  invoiceRepository: Repository<Invoice>;

  @InjectEntityModel(Contract)
  contractRepository: Repository<Contract>;

  constructor(private dataSource: DataSource) {}

  /**
   * 格式化发票数据，处理日期字段
   */
  private formatInvoiceResponse(invoice: Invoice): any {
    return DateUtil.formatEntityResponse(invoice, ['issue_date']);
  }

  /**
   * 创建发票
   */
  async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<any> {
    return await this.dataSource.transaction(async manager => {
      // 检查并更新合同状态
      await this.checkAndUpdateContractStatusOnInvoiceCreate(manager, createInvoiceDto.contract_id);

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
        total_amount,
        issue_date: DateUtil.parseDate(createInvoiceDto.issue_date)
      });

      const savedInvoice = await manager.save(invoice);

      // 格式化返回数据，处理日期字段
      return this.formatInvoiceResponse(savedInvoice);
    });
  }

  /**
   * 获取发票列表（分页）
   */
  async getInvoices(query: PaginationQuery & { contractId?: number; status?: string }): Promise<PaginationResult<any>> {
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

    // 格式化返回数据，处理日期字段
    const formattedItems = items.map(item => this.formatInvoiceResponse(item));

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 根据ID获取发票
   */
  async getInvoiceById(id: number): Promise<any | null> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['contract', 'contract.customer', 'payments']
    });

    if (!invoice) {
      return null;
    }

    // 格式化返回数据，处理日期字段
    return this.formatInvoiceResponse(invoice);
  }

  /**
   * 更新发票
   */
  async updateInvoice(id: number, updateInvoiceDto: UpdateInvoiceDto): Promise<any | null> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });

    if (!invoice) {
      return null;
    }

    // 处理日期字段
    const updateData = { ...updateInvoiceDto };
    if (updateData.issue_date) {
      updateData.issue_date = DateUtil.parseDate(updateData.issue_date) as any;
    }

    // 如果更新了金额或税率，重新计算
    if (updateData.amount !== undefined || updateData.tax_rate !== undefined) {
      const amount = updateData.amount ?? invoice.amount;
      const tax_rate = updateData.tax_rate ?? invoice.tax_rate;
      const tax_amount = amount * (tax_rate / 100);
      const total_amount = amount + tax_amount;

      updateData.tax_amount = tax_amount;
      updateData.total_amount = total_amount;
    }

    Object.assign(invoice, updateData);
    const savedInvoice = await this.invoiceRepository.save(invoice);

    // 格式化返回数据，处理日期字段
    return this.formatInvoiceResponse(savedInvoice);
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
   * 获取发票统计信息（优化版本）
   */
  async getInvoiceStats(): Promise<any> {
    const result = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN invoice.status = \'draft\' THEN 1 ELSE 0 END) as draft',
        'SUM(CASE WHEN invoice.status = \'sent\' THEN 1 ELSE 0 END) as sent',
        'SUM(CASE WHEN invoice.status = \'paid\' THEN 1 ELSE 0 END) as paid',
        'SUM(CASE WHEN invoice.status = \'overdue\' THEN 1 ELSE 0 END) as overdue',
        'SUM(invoice.total_amount) as totalAmount',
        'SUM(CASE WHEN invoice.status = \'paid\' THEN invoice.total_amount ELSE 0 END) as paidAmount',
        'SUM(CASE WHEN invoice.status IN (\'sent\', \'overdue\') THEN invoice.total_amount ELSE 0 END) as unpaidAmount'
      ])
      .getRawOne();

    return {
      total: parseInt(result.total) || 0,
      draft: parseInt(result.draft) || 0,
      sent: parseInt(result.sent) || 0,
      paid: parseInt(result.paid) || 0,
      overdue: parseInt(result.overdue) || 0,
      totalAmount: parseFloat(result.totalAmount) || 0,
      paidAmount: parseFloat(result.paidAmount) || 0,
      unpaidAmount: parseFloat(result.unpaidAmount) || 0
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

  /**
   * 创建发票时检查并更新合同状态
   */
  private async checkAndUpdateContractStatusOnInvoiceCreate(manager: any, contractId: number): Promise<void> {
    const contract = await manager.findOne(Contract, { where: { id: contractId } });

    if (!contract) {
      return;
    }

    // 如果合同状态为草稿，创建发票时自动将其更新为执行中
    if (contract.status === 'draft') {
      await manager.update(Contract, contractId, { status: 'active' });
    }
  }
}
