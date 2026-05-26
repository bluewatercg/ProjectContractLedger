import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entity/customer.entity';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  PaginationQuery,
  PaginationResult,
} from '../interface';

@Provide()
export class CustomerService {
  @InjectEntityModel(Customer)
  customerRepository: Repository<Customer>;

  @Inject()
  statisticsService: any; // 延迟注入避免循环依赖

  @Inject()
  contractService: any; // 同样使用延迟注入或 dynamic injection 如果必要，但 Midway 默认支持循环依赖处理

  /**
   * 创建客户
   */
  async createCustomer(
    createCustomerDto: CreateCustomerDto,
    kitId: number,
    createdBy: number
  ): Promise<Customer> {
    const customer = this.customerRepository.create({
      ...createCustomerDto,
      kit_id: kitId,
      created_by: createdBy,
    });
    const savedCustomer = await this.customerRepository.save(customer);

    // 清除相关缓存
    if (this.statisticsService?.invalidateCustomerCache) {
      this.statisticsService.invalidateCustomerCache();
    }

    return savedCustomer;
  }

  /**
   * 获取客户列表（分页）
   */
  async getCustomers(
    query: PaginationQuery & {
      search?: string;
      hasUnpaidInvoices?: boolean;
      hasActiveContracts?: boolean;
      status?: string;
    },
    kitId?: number
  ): Promise<PaginationResult<Customer>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search,
      hasUnpaidInvoices,
      hasActiveContracts,
      status,
    } = query;

    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    // 按kit_id过滤
    if (kitId) {
      queryBuilder.where('customer.kit_id = :kitId', { kitId });
    }

    // 状态筛选：支持 active / inactive(历史合作) / dormant(停用)
    // inactive = 1年内有过期合同
    // dormant = inactive + 有过合同但超1年未续约
    // last_contract_end_date IS NULL = 从未有过合同（前端显示"未合作"，不参与筛选）
    if (status) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (status === 'inactive') {
        queryBuilder.andWhere(
          "(customer.status = 'inactive' AND customer.last_contract_end_date IS NOT NULL AND customer.last_contract_end_date >= :oneYearAgo)",
          { oneYearAgo }
        );
      } else if (status === 'dormant') {
        queryBuilder.andWhere(
          "(customer.status = 'inactive' AND customer.last_contract_end_date IS NOT NULL AND customer.last_contract_end_date < :oneYearAgo)",
          { oneYearAgo }
        );
      } else {
        queryBuilder.andWhere('customer.status = :status', { status });
      }
    }

    // 如果需要筛选有未完全收款发票的客户
    if (hasUnpaidInvoices) {
      queryBuilder
        .innerJoin('customer.contracts', 'contract')
        .innerJoin('contract.invoices', 'invoice')
        .leftJoin(
          'invoice.payments',
          'payment',
          'payment.status = :paymentStatus',
          { paymentStatus: 'completed' }
        )
        .andWhere('invoice.status IN (:...invoiceStatuses)', {
          invoiceStatuses: ['draft', 'sent', 'overdue'],
        })
        .groupBy(
          'customer.id, customer.kit_id, customer.name, customer.contact_person, customer.phone, customer.email, customer.address, customer.status, customer.last_contract_end_date, customer.created_at, customer.updated_at'
        )
        .having('COALESCE(SUM(payment.amount), 0) < SUM(invoice.total_amount)');
    }

    // 如果需要筛选有活跃合同的客户
    if (hasActiveContracts && !hasUnpaidInvoices) {
      queryBuilder
        .innerJoin('customer.contracts', 'contract')
        .andWhere('contract.status IN (:...contractStatuses)', {
          contractStatuses: ['draft', 'active', 'signed'],
        })
        .groupBy(
          'customer.id, customer.kit_id, customer.name, customer.contact_person, customer.phone, customer.email, customer.address, customer.status, customer.last_contract_end_date, customer.created_at, customer.updated_at'
        );
    }

    // 搜索条件
    if (search) {
      const searchCondition =
        '(customer.name LIKE :search OR customer.contact_person LIKE :search OR customer.phone LIKE :search OR customer.email LIKE :search)';
      queryBuilder.andWhere(searchCondition, { search: `%${search}%` });
    }

    // 排序
    queryBuilder.orderBy(`customer.${sortBy}`, sortOrder);

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
   * 根据ID获取客户
   */
  async getCustomerById(id: number, kitId?: number): Promise<any | null> {
    const whereCondition: any = { id };
    if (kitId) {
      whereCondition.kit_id = kitId;
    }

    const customer = await this.customerRepository.findOne({
      where: whereCondition,
      relations: ['contracts', 'contracts.invoices', 'contracts.invoices.payments'],
    });

    if (!customer) return null;

    // 丰富合同的财务信息
    if (customer.contracts && customer.contracts.length > 0) {
      customer.contracts = customer.contracts.map(contract => {
        const stats = this.contractService.calculateFinancialStats(contract);
        return {
          ...contract,
          ...stats,
        };
      });
    }

    return customer;
  }

  /**
   * 更新客户
   */
  async updateCustomer(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
    kitId?: number
  ): Promise<Customer | null> {
    const whereCondition: any = { id };
    if (kitId) {
      whereCondition.kit_id = kitId;
    }

    const customer = await this.customerRepository.findOne({ where: whereCondition });

    if (!customer) {
      return null;
    }

    Object.assign(customer, updateCustomerDto);
    const savedCustomer = await this.customerRepository.save(customer);

    // 清除相关缓存
    if (this.statisticsService?.invalidateCustomerCache) {
      this.statisticsService.invalidateCustomerCache();
    }

    return savedCustomer;
  }

  /**
   * 删除客户
   */
  async deleteCustomer(id: number, kitId?: number): Promise<boolean> {
    const whereCondition: any = { id };
    if (kitId) {
      whereCondition.kit_id = kitId;
    }

    const result = await this.customerRepository.delete(whereCondition);
    return result.affected > 0;
  }

  /**
   * 获取活跃客户数量
   */
  async getActiveCustomersCount(kitId?: number): Promise<number> {
    const whereCondition: any = { status: 'active' };
    if (kitId) {
      whereCondition.kit_id = kitId;
    }

    return await this.customerRepository.count({
      where: whereCondition,
    });
  }

  /**
   * 根据状态获取客户列表
   */
  async getCustomersByStatus(status: string, kitId?: number): Promise<Customer[]> {
    const whereCondition: any = { status };
    if (kitId) {
      whereCondition.kit_id = kitId;
    }

    return await this.customerRepository.find({
      where: whereCondition,
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 获取客户统计信息（优化版本）
   */
  async getCustomerStats(kitId?: number): Promise<any> {
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .select([
        'COUNT(*) as total',
        "SUM(CASE WHEN customer.status = 'active' THEN 1 ELSE 0 END) as active",
        "SUM(CASE WHEN customer.status = 'inactive' THEN 1 ELSE 0 END) as inactive",
      ]);

    if (kitId) {
      queryBuilder.where('customer.kit_id = :kitId', { kitId });
    }

    const result = await queryBuilder.getRawOne();

    return {
      total: parseInt(result.total) || 0,
      active: parseInt(result.active) || 0,
      inactive: parseInt(result.inactive) || 0,
    };
  }
}

