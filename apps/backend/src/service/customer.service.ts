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

  /**
   * 创建客户
   */
  async createCustomer(
    createCustomerDto: CreateCustomerDto
  ): Promise<Customer> {
    const customer = this.customerRepository.create(createCustomerDto);
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
    }
  ): Promise<PaginationResult<Customer>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search,
      hasUnpaidInvoices,
      hasActiveContracts,
    } = query;

    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

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
        .where('invoice.status IN (:...invoiceStatuses)', {
          invoiceStatuses: ['draft', 'sent', 'overdue'],
        })
        .groupBy(
          'customer.id, customer.name, customer.contact_person, customer.phone, customer.email, customer.address, customer.status, customer.created_at, customer.updated_at'
        )
        .having('COALESCE(SUM(payment.amount), 0) < SUM(invoice.total_amount)');
    }

    // 如果需要筛选有活跃合同的客户
    if (hasActiveContracts && !hasUnpaidInvoices) {
      queryBuilder
        .innerJoin('customer.contracts', 'contract')
        .where('contract.status IN (:...contractStatuses)', {
          contractStatuses: ['draft', 'active', 'signed'],
        })
        .groupBy(
          'customer.id, customer.name, customer.contact_person, customer.phone, customer.email, customer.address, customer.status, customer.created_at, customer.updated_at'
        );
    }

    // 搜索条件
    if (search) {
      const searchCondition =
        'customer.name LIKE :search OR customer.contact_person LIKE :search OR customer.phone LIKE :search OR customer.email LIKE :search';
      if (hasUnpaidInvoices || hasActiveContracts) {
        queryBuilder.andWhere(searchCondition, { search: `%${search}%` });
      } else {
        queryBuilder.where(searchCondition, { search: `%${search}%` });
      }
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
  async getCustomerById(id: number): Promise<Customer | null> {
    return await this.customerRepository.findOne({
      where: { id },
      relations: ['contracts'],
    });
  }

  /**
   * 更新客户
   */
  async updateCustomer(
    id: number,
    updateCustomerDto: UpdateCustomerDto
  ): Promise<Customer | null> {
    const customer = await this.customerRepository.findOne({ where: { id } });

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
  async deleteCustomer(id: number): Promise<boolean> {
    const result = await this.customerRepository.delete(id);
    return result.affected > 0;
  }

  /**
   * 获取活跃客户数量
   */
  async getActiveCustomersCount(): Promise<number> {
    return await this.customerRepository.count({
      where: { status: 'active' },
    });
  }

  /**
   * 根据状态获取客户列表
   */
  async getCustomersByStatus(status: string): Promise<Customer[]> {
    return await this.customerRepository.find({
      where: { status },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 获取客户统计信息（优化版本）
   */
  async getCustomerStats(): Promise<any> {
    const result = await this.customerRepository
      .createQueryBuilder('customer')
      .select([
        'COUNT(*) as total',
        "SUM(CASE WHEN customer.status = 'active' THEN 1 ELSE 0 END) as active",
        "SUM(CASE WHEN customer.status = 'inactive' THEN 1 ELSE 0 END) as inactive",
      ])
      .getRawOne();

    return {
      total: parseInt(result.total) || 0,
      active: parseInt(result.active) || 0,
      inactive: parseInt(result.inactive) || 0,
    };
  }
}
