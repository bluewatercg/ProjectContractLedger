import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel, InjectDataSource } from '@midwayjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice } from '../entity/invoice.entity';
import { Contract } from '../entity/contract.entity';
import { Payment } from '../entity/payment.entity';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  PaginationQuery,
  PaginationResult,
} from '../interface';
import { DateUtil } from '../utils/date.util';

@Provide()
export class InvoiceService {
  @InjectEntityModel(Invoice)
  invoiceRepository: Repository<Invoice>;

  @InjectEntityModel(Contract)
  contractRepository: Repository<Contract>;

  @InjectDataSource()
  dataSource: DataSource;

  @Inject()
  statisticsService: any; // 延迟注入避免循环依赖

  @Inject()
  contractService: any; // 延迟注入避免循环依赖

  /**
   * 格式化发票数据，处理日期字段
   */
  private formatInvoiceResponse(invoice: Invoice): any {
    return DateUtil.formatEntityResponse(invoice, ['issue_date', 'due_date']);
  }

  /**
   * 创建发票
   */
  async createInvoice(
    createInvoiceDto: CreateInvoiceDto,
    kitId: number
  ): Promise<any> {
    return await this.dataSource.transaction(async manager => {
      // 检查并更新合同状态
      await this.checkAndUpdateContractStatusOnInvoiceCreate(
        manager,
        createInvoiceDto.contract_id
      );

      // 生成发票编号
      const invoiceNumber = await this.generateInvoiceNumber();

      // 计算税额和总额
      const { amount, tax_rate = 0 } = createInvoiceDto;
      const tax_amount = amount * (tax_rate / 100);
      const total_amount = amount + tax_amount;

      const invoice = this.invoiceRepository.create({
        ...createInvoiceDto,
        invoice_number: invoiceNumber,
        kit_id: kitId,
        tax_amount,
        total_amount,
        issue_date: DateUtil.parseDate(createInvoiceDto.issue_date),
        due_date: DateUtil.parseDate(createInvoiceDto.due_date),
        // 默认为草稿状态，上传附件后自动变为已开票
        status: 'draft',
      });

      const savedInvoice = await manager.save(invoice);

      // 清除相关缓存
      if (this.statisticsService?.invalidateInvoiceCache) {
        this.statisticsService.invalidateInvoiceCache();
      }

      // 自动更新合同状态：有发票 -> active（执行中）
      if (this.contractService?.updateContractStatusByAttachmentsOrInvoices) {
        try {
          await this.contractService.updateContractStatusByAttachmentsOrInvoices(
            createInvoiceDto.contract_id
          );
        } catch (statusError) {
          console.error('更新合同状态失败:', statusError.message);
          // 不影响发票创建的成功，只记录错误
        }
      }

      // 格式化返回数据，处理日期字段
      return this.formatInvoiceResponse(savedInvoice);
    });
  }

  /**
   * 获取发票列表（分页）
   */
  async getInvoices(
    query: PaginationQuery & {
      contractId?: number;
      customerId?: number;
      status?: string;
    },
    kitId?: number
  ): Promise<PaginationResult<any>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      contractId,
      customerId,
      status,
    } = query;

    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.contract', 'contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('invoice.payments', 'payments');

    // 按kit_id过滤
    if (kitId) {
      queryBuilder.where('invoice.kit_id = :kitId', { kitId });
    }

    // 过滤条件
    if (contractId) {
      queryBuilder.andWhere('invoice.contract_id = :contractId', {
        contractId,
      });
    }

    if (customerId) {
      queryBuilder.andWhere('contract.customer_id = :customerId', {
        customerId,
      });
    }

    if (status) {
      // 支持多个状态，用逗号分隔
      const statuses = status.split(',').map(s => s.trim());
      queryBuilder.andWhere('invoice.status IN (:...statuses)', { statuses });
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
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 根据ID获取发票
   */
  async getInvoiceById(id: number, kitId?: number): Promise<any | null> {
    const whereCondition: any = { id };
    if (kitId) {
      whereCondition.kit_id = kitId;
    }

    const invoice = await this.invoiceRepository.findOne({
      where: whereCondition,
      relations: ['contract', 'contract.customer', 'payments'],
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
  async updateInvoice(
    id: number,
    updateInvoiceDto: UpdateInvoiceDto,
    kitId?: number
  ): Promise<any | null> {
    const whereCondition: any = { id };
    if (kitId) {
      whereCondition.kit_id = kitId;
    }

    const invoice = await this.invoiceRepository.findOne({ where: whereCondition });

    if (!invoice) {
      return null;
    }

    // 处理日期字段
    const updateData = { ...updateInvoiceDto };
    if (updateData.issue_date) {
      updateData.issue_date = DateUtil.parseDate(updateData.issue_date) as any;
    }
    if (updateData.due_date) {
      updateData.due_date = DateUtil.parseDate(updateData.due_date) as any;
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

    // 清除相关缓存
    if (this.statisticsService?.invalidateInvoiceCache) {
      this.statisticsService.invalidateInvoiceCache();
    }

    // 格式化返回数据，处理日期字段
    return this.formatInvoiceResponse(savedInvoice);
  }

  /**
   * 删除发票
   */
  async deleteInvoice(id: number, kitId?: number): Promise<boolean> {
    const whereCondition: any = { id };
    if (kitId) {
      whereCondition.kit_id = kitId;
    }

    // 先获取发票以获得 contract_id
    const invoice = await this.invoiceRepository.findOne({
      where: whereCondition,
    });

    const result = await this.invoiceRepository.delete(whereCondition);

    // 清除相关缓存
    if (result.affected > 0 && this.statisticsService?.invalidateInvoiceCache) {
      this.statisticsService.invalidateInvoiceCache();
    }

    // 自动更新合同状态：无发票且无附件 -> draft（草稿）
    if (
      invoice &&
      result.affected > 0 &&
      this.contractService?.updateContractStatusByAttachmentsOrInvoices
    ) {
      try {
        await this.contractService.updateContractStatusByAttachmentsOrInvoices(
          invoice.contract_id
        );
      } catch (statusError) {
        console.error('更新合同状态失败:', statusError.message);
        // 不影响发票删除的成功，只记录错误
      }
    }

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
  async getInvoiceStats(year?: number, kitId?: number): Promise<any> {
    // 基础统计：发票状态分布和总额
    const invoiceQueryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .select([
        'COUNT(*) as total',
        "SUM(CASE WHEN invoice.status = 'draft' THEN 1 ELSE 0 END) as draft",
        "SUM(CASE WHEN invoice.status = 'sent' THEN 1 ELSE 0 END) as sent",
        "SUM(CASE WHEN invoice.status = 'paid' THEN 1 ELSE 0 END) as paid",
        "SUM(CASE WHEN invoice.status = 'overdue' THEN 1 ELSE 0 END) as overdue",
        "SUM(CASE WHEN invoice.status <> 'cancelled' THEN invoice.total_amount ELSE 0 END) as totalAmount",
      ]);

    if (kitId) {
      invoiceQueryBuilder.where('invoice.kit_id = :kitId', { kitId });
    }

    if (year) {
      invoiceQueryBuilder.andWhere('YEAR(invoice.issue_date) = :year', {
        year,
      });
    }

    const invoiceResult = await invoiceQueryBuilder.getRawOne();

    // 实际已收款：从支付表统计已完成的支付
    // 关键修复：按发票年份过滤，而不是支付日期年份
    const paymentsQueryBuilder = this.dataSource
      .getRepository(Payment)
      .createQueryBuilder('payment')
      .leftJoin('payment.invoice', 'invoice')
      .select('SUM(payment.amount)', 'total')
      .where("payment.status = 'completed'");

    if (kitId) {
      paymentsQueryBuilder.andWhere('payment.kit_id = :kitId', { kitId });
    }

    if (year) {
      // 关键：基于发票开票年份过滤，而不是支付日期年份
      // 这样可以正确统计指定年份发票的已付金额
      paymentsQueryBuilder.andWhere('YEAR(invoice.issue_date) = :year', {
        year,
      });
    }

    const paymentsResult = await paymentsQueryBuilder.getRawOne();

    const totalAmount = parseFloat(invoiceResult.totalAmount) || 0;
    const paidAmount = parseFloat(paymentsResult.total) || 0;

    return {
      total: parseInt(invoiceResult.total) || 0,
      draft: parseInt(invoiceResult.draft) || 0,
      sent: parseInt(invoiceResult.sent) || 0,
      paid: parseInt(invoiceResult.paid) || 0,
      overdue: parseInt(invoiceResult.overdue) || 0,
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      unpaidAmount: Math.max(0, totalAmount - paidAmount),
    };
  }

  /**
   * 获取逾期发票
   */
  async getOverdueInvoices(kitId?: number): Promise<Invoice[]> {
    const today = new Date();
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.contract', 'contract')
      .leftJoinAndSelect('contract.customer', 'customer');

    if (kitId) {
      queryBuilder.where('invoice.kit_id = :kitId', { kitId });
    }

    return await queryBuilder
      .andWhere('invoice.due_date < :today', { today })
      .andWhere('invoice.status IN (:...statuses)', {
        statuses: ['sent', 'overdue'],
      })
      .orderBy('invoice.due_date', 'ASC')
      .getMany();
  }

  /**
   * 创建发票时检查并更新合同状态
   */
  private async checkAndUpdateContractStatusOnInvoiceCreate(
    manager: any,
    contractId: number
  ): Promise<void> {
    const contract = await manager.findOne(Contract, {
      where: { id: contractId },
    });

    if (!contract) {
      return;
    }

    // 如果合同状态为草稿，创建发票时自动将其更新为执行中
    if (contract.status === 'draft') {
      await manager.update(Contract, contractId, { status: 'active' });
    }
  }

  /**
   * 根据附件数量自动更新发票状态
   * @param invoiceId 发票ID
   */
  async updateInvoiceStatusByAttachments(invoiceId: number): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['attachments'],
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // 只有当前状态是 draft 或 sent 时才自动更新
    if (invoice.status !== 'draft' && invoice.status !== 'sent') {
      return; // 如果已经是 paid 或 overdue，不自动改变状态
    }

    const hasAttachments =
      invoice.attachments && invoice.attachments.length > 0;
    const newStatus = hasAttachments ? 'sent' : 'draft';

    if (invoice.status !== newStatus) {
      invoice.status = newStatus;
      await this.invoiceRepository.save(invoice);

      // 清除相关缓存
      if (this.statisticsService?.invalidateInvoiceCache) {
        this.statisticsService.invalidateInvoiceCache();
      }

      console.log(
        `Invoice #${invoiceId} status updated: ${invoice.status} -> ${newStatus} (attachments: ${invoice.attachments.length})`
      );
    }
  }
}
