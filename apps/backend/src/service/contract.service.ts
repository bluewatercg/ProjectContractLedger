import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../entity/contract.entity';
import { Customer } from '../entity/customer.entity';
import {
  CreateContractDto,
  UpdateContractDto,
  PaginationQuery,
  PaginationResult,
} from '../interface';
import { DateUtil } from '../utils/date.util';

@Provide()
export class ContractService {
  @InjectEntityModel(Contract)
  contractRepository: Repository<Contract>;

  @InjectEntityModel(Customer)
  customerRepository: Repository<Customer>;

  @Inject()
  statisticsService: any; // 延迟注入避免循环依赖

  /**
   * 格式化合同数据，处理日期字段
   */
  private formatContractResponse(contract: Contract): any {
    return DateUtil.formatEntityResponse(contract, ['start_date', 'end_date']);
  }

  /**
   * 根据ID获取客户信息
   */
  async getCustomerById(customerId: number): Promise<Customer | null> {
    return await this.customerRepository.findOne({
      where: { id: customerId },
    });
  }

  /**
   * 创建合同
   */
  async createContract(
    createContractDto: CreateContractDto,
    kitId: number,
    createdBy: number
  ): Promise<any> {
    // 生成合同编号
    const contractNumber = await this.generateContractNumber();

    const contract = this.contractRepository.create({
      ...createContractDto,
      contract_number: contractNumber,
      kit_id: kitId,
      created_by: createdBy,
      start_date: DateUtil.parseDate(createContractDto.start_date),
      end_date: DateUtil.parseDate(createContractDto.end_date),
    });

    const savedContract = await this.contractRepository.save(contract);

    // 清除相关缓存
    if (this.statisticsService?.invalidateContractCache) {
      this.statisticsService.invalidateContractCache();
    }

    // 格式化返回数据，处理日期字段
    return this.formatContractResponse(savedContract);
  }

  /**
   * 获取合同列表（分页）- 包含财务统计信息
   */
  async getContracts(
    query: PaginationQuery & {
      customerId?: number;
      status?: string;
      billingStatus?: string;
      search?: string;
    },
    kitId?: number
  ): Promise<PaginationResult<any>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      customerId,
      status,
      billingStatus,
      search,
    } = query;

    const queryBuilder = this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer')
      .leftJoinAndSelect('contract.invoices', 'invoice')
      .leftJoinAndSelect('invoice.payments', 'payment');

    // 按kit_id过滤
    if (kitId) {
      queryBuilder.where('contract.kit_id = :kitId', { kitId });
    }

    // 过滤条件
    if (customerId) {
      queryBuilder.andWhere('contract.customer_id = :customerId', {
        customerId,
      });
    }

    if (status) {
      queryBuilder.andWhere('contract.status = :status', { status });
    }

    // 搜索功能：支持合同编号和标题模糊查询
    if (search) {
      queryBuilder.andWhere(
        '(contract.contract_number LIKE :search OR contract.title LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // 如果有财务状态筛选，需要先获取所有数据进行过滤（因为财务状态是计算出来的）
    if (billingStatus) {
      // 获取所有匹配的合同（不分页）
      const allItems = await queryBuilder.getMany();

      // 格式化并计算财务统计
      const formattedItems = await Promise.all(
        allItems.map(async item => {
          const formatted = this.formatContractResponse(item);
          const financialStats = this.calculateFinancialStats(item);
          return {
            ...formatted,
            ...financialStats,
          };
        })
      );

      // 按财务状态过滤
      const filteredItems = formattedItems.filter(
        item => item.billingStatus === billingStatus
      );

      // 按优先级排序：待收款 > 待开票 > 其他
      filteredItems.sort((a, b) => {
        const priorityMap = {
          pending_payment: 3,
          pending_invoice: 2,
          partial_invoice: 1,
          completed: 0,
        };
        const priorityA = priorityMap[a.billingStatus] || 0;
        const priorityB = priorityMap[b.billingStatus] || 0;

        if (priorityA !== priorityB) {
          return priorityB - priorityA; // 优先级高的在前
        }

        // 优先级相同，按创建时间排序
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // 手动分页
      const total = filteredItems.length;
      const offset = (page - 1) * limit;
      const paginatedItems = filteredItems.slice(offset, offset + limit);

      return {
        items: paginatedItems,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } else {
      // 没有财务状态筛选，按原逻辑进行数据库分页
      // 排序
      queryBuilder.orderBy(`contract.${sortBy}`, sortOrder);

      // 分页
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      const [items, total] = await queryBuilder.getManyAndCount();

      // 格式化返回数据，添加财务统计信息
      const formattedItems = await Promise.all(
        items.map(async item => {
          const formatted = this.formatContractResponse(item);
          const financialStats = this.calculateFinancialStats(item);
          return {
            ...formatted,
            ...financialStats,
          };
        })
      );

      // 按优先级排序（客户端排序）
      formattedItems.sort((a, b) => {
        const priorityMap = {
          pending_payment: 3,
          pending_invoice: 2,
          partial_invoice: 1,
          completed: 0,
        };
        const priorityA = priorityMap[a.billingStatus] || 0;
        const priorityB = priorityMap[b.billingStatus] || 0;

        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }

        // 优先级相同，保持数据库排序
        return 0;
      });

      return {
        items: formattedItems,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }
  }

  /**
   * 计算合同的财务统计信息
   */
  public calculateFinancialStats(contract: any): {
    invoicedAmount: number;
    uninvoicedAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    invoiceCount: number;
    billingStatus: string;
    billingStatusText: string;
    invoices?: any[];
  } {
    const contractAmount = parseFloat(contract.total_amount?.toString() || '0');

    // 计算已开票金额和数量
    let invoicedAmount = 0;
    let invoiceCount = 0;
    const invoiceStats = [];

    if (contract.invoices && Array.isArray(contract.invoices)) {
      invoiceCount = contract.invoices.length;
      contract.invoices.forEach((invoice: any) => {
        const invAmount = parseFloat(invoice.total_amount?.toString() || '0');
        invoicedAmount += invAmount;

        // 计算该张发票的已收金额
        const invPaidAmount =
          invoice.payments
            ?.filter((p: any) => p.status === 'completed')
            .reduce((pSum: number, payment: any) => {
              return pSum + parseFloat(payment.amount?.toString() || '0');
            }, 0) || 0;

        invoiceStats.push({
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          total_amount: invAmount,
          paidAmount: invPaidAmount,
          status: invoice.status,
        });
      });
    }

    // 按创建日期或编号排序发票，确保进度条展示顺序一致
    invoiceStats.sort((a, b) => a.id - b.id);

    // 计算未开票金额 (合同总额 - 已开票金额)
    const uninvoicedAmount = Math.max(0, contractAmount - invoicedAmount);

    // 计算总已收款金额
    const totalPaidAmount = invoiceStats.reduce((sum, inv) => sum + inv.paidAmount, 0);

    // 计算总未收款金额（基于已开票金额：已开票额 - 已收额）
    const unpaidAmount = Math.max(0, invoicedAmount - totalPaidAmount);

    // 判断财务状态
    let billingStatus: string;
    let billingStatusText: string;

    if (invoicedAmount === 0) {
      billingStatus = 'pending_invoice';
      billingStatusText = '待开票';
    } else if (unpaidAmount > 0.01) {
      // 使用 0.01 避免浮点数精度带来的误判
      billingStatus = 'pending_payment';
      billingStatusText = '待收款';
    } else if (uninvoicedAmount > 1) {
      billingStatus = 'partial_invoice';
      billingStatusText = '部分开票';
    } else {
      billingStatus = 'completed';
      billingStatusText = '已完成';
    }

    return {
      invoicedAmount,
      uninvoicedAmount,
      paidAmount: totalPaidAmount,
      unpaidAmount,
      invoiceCount,
      billingStatus,
      billingStatusText,
      invoiceStats, // 返回分张发票的统计数据
    } as any;
  }

  /**
   * 根据ID获取合同
   */
  async getContractById(id: number, kitId?: number): Promise<any | null> {
    const whereCondition: any = { id };
    if (kitId) {
      whereCondition.kit_id = kitId;
    }

    const contract = await this.contractRepository.findOne({
      where: whereCondition,
      relations: ['customer', 'invoices', 'invoices.payments', 'invoice_plans'],
    });

    if (!contract) {
      return null;
    }

    // 格式化返回数据，处理日期字段
    return this.formatContractResponse(contract);
  }

  /**
   * 更新合同
   */
  async updateContract(
    id: number,
    updateContractDto: UpdateContractDto,
    kitId?: number
  ): Promise<any | null> {
    const whereCondition: any = { id };
    if (kitId) {
      whereCondition.kit_id = kitId;
    }

    const contract = await this.contractRepository.findOne({ where: whereCondition });

    if (!contract) {
      return null;
    }

    // 处理日期字段
    const updateData = { ...updateContractDto };
    if (updateData.start_date) {
      updateData.start_date = DateUtil.parseDate(updateData.start_date) as any;
    }
    if (updateData.end_date) {
      updateData.end_date = DateUtil.parseDate(updateData.end_date) as any;
    }

    Object.assign(contract, updateData);
    const savedContract = await this.contractRepository.save(contract);

    // 清除相关缓存
    if (this.statisticsService?.invalidateContractCache) {
      this.statisticsService.invalidateContractCache();
    }

    // 格式化返回数据，处理日期字段
    return this.formatContractResponse(savedContract);
  }

  /**
   * 删除合同
   */
  async deleteContract(id: number, kitId?: number): Promise<boolean> {
    const whereCondition: any = { id };
    if (kitId) {
      whereCondition.kit_id = kitId;
    }

    const result = await this.contractRepository.delete(whereCondition);
    return result.affected > 0;
  }

  /**
   * 生成合同编号
   */
  private async generateContractNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // 查找当月最大编号
    const prefix = `CT${year}${month}`;
    const lastContract = await this.contractRepository
      .createQueryBuilder('contract')
      .where('contract.contract_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('contract.contract_number', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastContract) {
      const lastNumber = lastContract.contract_number.substring(prefix.length);
      sequence = parseInt(lastNumber) + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * 获取合同统计信息（优化版本）
   */
  async getContractStats(year?: number, kitId?: number): Promise<any> {
    const queryBuilder = this.contractRepository
      .createQueryBuilder('contract')
      .select([
        'COUNT(*) as total',
        "SUM(CASE WHEN contract.status = 'active' THEN 1 ELSE 0 END) as active",
        "SUM(CASE WHEN contract.status = 'completed' THEN 1 ELSE 0 END) as completed",
        "SUM(CASE WHEN contract.status = 'draft' THEN 1 ELSE 0 END) as draft",
        "SUM(CASE WHEN contract.status IN ('active', 'completed') THEN contract.total_amount ELSE 0 END) as totalAmount",
      ]);

    if (kitId) {
      queryBuilder.where('contract.kit_id = :kitId', { kitId });
    }

    if (year) {
      queryBuilder.andWhere('YEAR(contract.start_date) = :year', { year });
    }

    const result = await queryBuilder.getRawOne();

    return {
      total: parseInt(result.total) || 0,
      active: parseInt(result.active) || 0,
      completed: parseInt(result.completed) || 0,
      draft: parseInt(result.draft) || 0,
      totalAmount: parseFloat(result.totalAmount) || 0,
    };
  }

  /**
   * 检查并自动完成符合条件的合同
   * 条件：执行中 + 到期日期已过 + 金额已结清
   */
  async checkAndCompleteEligibleContracts(kitId?: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const queryBuilder = this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.invoices', 'invoice')
      .leftJoinAndSelect('invoice.payments', 'payment')
      .where('contract.status = :status', { status: 'active' })
      .andWhere('contract.end_date <= :today', { today });

    if (kitId) {
      queryBuilder.andWhere('contract.kit_id = :kitId', { kitId });
    }

    const contracts = await queryBuilder.getMany();
    let completedCount = 0;

    for (const contract of contracts) {
      const stats = this.calculateFinancialStats(contract);

      // 如果财务状态也是已完成 (说明金额结清)
      if (stats.billingStatus === 'completed') {
        await this.contractRepository.update(contract.id, {
          status: 'completed',
          updated_at: new Date()
        });
        completedCount++;
      }
    }

    if (completedCount > 0 && this.statisticsService?.invalidateContractCache) {
      this.statisticsService.invalidateContractCache();
    }

    return completedCount;
  }

  /**
   * 根据附件或发票自动更新合同状态
   * @param contractId 合同ID
   */
  async updateContractStatusByAttachmentsOrInvoices(
    contractId: number
  ): Promise<void> {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
      relations: ['attachments', 'invoices'],
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // 只有当前状态是 draft 或 active 时才自动更新
    if (contract.status !== 'draft' && contract.status !== 'active') {
      return; // 如果已经是 completed 或 cancelled，不自动改变状态
    }

    // 判断是否有附件或发票
    const hasAttachments =
      contract.attachments && contract.attachments.length > 0;
    const hasInvoices = contract.invoices && contract.invoices.length > 0;
    const shouldBeActive = hasAttachments || hasInvoices;

    const newStatus = shouldBeActive ? 'active' : 'draft';

    if (contract.status !== newStatus) {
      contract.status = newStatus;
      await this.contractRepository.save(contract);

      // 清除相关缓存
      if (this.statisticsService?.invalidateContractCache) {
        this.statisticsService.invalidateContractCache();
      }

      console.log(
        `Contract #${contractId} status updated: ${contract.status} -> ${newStatus} (attachments: ${contract.attachments?.length || 0}, invoices: ${contract.invoices?.length || 0})`
      );
    }
  }
}
