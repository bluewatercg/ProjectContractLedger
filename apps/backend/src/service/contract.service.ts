import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../entity/contract.entity';
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

  @Inject()
  statisticsService: any; // 延迟注入避免循环依赖

  /**
   * 格式化合同数据，处理日期字段
   */
  private formatContractResponse(contract: Contract): any {
    return DateUtil.formatEntityResponse(contract, ['start_date', 'end_date']);
  }

  /**
   * 创建合同
   */
  async createContract(createContractDto: CreateContractDto): Promise<any> {
    // 生成合同编号
    const contractNumber = await this.generateContractNumber();

    const contract = this.contractRepository.create({
      ...createContractDto,
      contract_number: contractNumber,
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
    }
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
  private calculateFinancialStats(contract: any): {
    invoicedAmount: number;
    uninvoicedAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    billingStatus: string;
    billingStatusText: string;
  } {
    const contractAmount = parseFloat(contract.total_amount?.toString() || '0');

    // 计算已开票金额
    const invoicedAmount =
      contract.invoices?.reduce((sum: number, invoice: any) => {
        return sum + parseFloat(invoice.total_amount?.toString() || '0');
      }, 0) || 0;

    // 计算未开票金额
    const uninvoicedAmount = Math.max(0, contractAmount - invoicedAmount);

    // 计算已收款金额（只计算已完成的支付）
    const paidAmount =
      contract.invoices?.reduce((sum: number, invoice: any) => {
        const invoicePayments =
          invoice.payments?.filter((p: any) => p.status === 'completed') || [];
        return (
          sum +
          invoicePayments.reduce((pSum: number, payment: any) => {
            return pSum + parseFloat(payment.amount?.toString() || '0');
          }, 0)
        );
      }, 0) || 0;

    // 计算未收款金额（基于已开票金额）
    const unpaidAmount = Math.max(0, invoicedAmount - paidAmount);

    // 判断财务状态
    let billingStatus: string;
    let billingStatusText: string;

    if (invoicedAmount === 0) {
      billingStatus = 'pending_invoice';
      billingStatusText = '待开票';
    } else if (unpaidAmount > 0) {
      billingStatus = 'pending_payment';
      billingStatusText = '待收款';
    } else if (uninvoicedAmount > 0) {
      billingStatus = 'partial_invoice';
      billingStatusText = '部分开票';
    } else {
      billingStatus = 'completed';
      billingStatusText = '已完成';
    }

    return {
      invoicedAmount,
      uninvoicedAmount,
      paidAmount,
      unpaidAmount,
      billingStatus,
      billingStatusText,
    };
  }

  /**
   * 根据ID获取合同
   */
  async getContractById(id: number): Promise<any | null> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['customer', 'invoices', 'invoices.payments'],
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
    updateContractDto: UpdateContractDto
  ): Promise<any | null> {
    const contract = await this.contractRepository.findOne({ where: { id } });

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
  async deleteContract(id: number): Promise<boolean> {
    const result = await this.contractRepository.delete(id);
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
  async getContractStats(year?: number): Promise<any> {
    const queryBuilder = this.contractRepository
      .createQueryBuilder('contract')
      .select([
        'COUNT(*) as total',
        "SUM(CASE WHEN contract.status = 'active' THEN 1 ELSE 0 END) as active",
        "SUM(CASE WHEN contract.status = 'completed' THEN 1 ELSE 0 END) as completed",
        "SUM(CASE WHEN contract.status = 'draft' THEN 1 ELSE 0 END) as draft",
        "SUM(CASE WHEN contract.status IN ('active', 'completed') THEN contract.total_amount ELSE 0 END) as totalAmount",
      ]);

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
}
