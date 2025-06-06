import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entity/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto, PaginationQuery, PaginationResult } from '../interface';

@Provide()
export class CustomerService {
  @InjectEntityModel(Customer)
  customerRepository: Repository<Customer>;

  /**
   * 创建客户
   */
  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customerRepository.create(createCustomerDto);
    return await this.customerRepository.save(customer);
  }

  /**
   * 获取客户列表（分页）
   */
  async getCustomers(query: PaginationQuery & { search?: string }): Promise<PaginationResult<Customer>> {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC', search } = query;
    
    const queryBuilder = this.customerRepository.createQueryBuilder('customer');
    
    // 搜索条件
    if (search) {
      queryBuilder.where(
        'customer.name LIKE :search OR customer.contact_person LIKE :search OR customer.phone LIKE :search OR customer.email LIKE :search',
        { search: `%${search}%` }
      );
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
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 根据ID获取客户
   */
  async getCustomerById(id: number): Promise<Customer | null> {
    return await this.customerRepository.findOne({
      where: { id },
      relations: ['contracts']
    });
  }

  /**
   * 更新客户
   */
  async updateCustomer(id: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer | null> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    
    if (!customer) {
      return null;
    }
    
    Object.assign(customer, updateCustomerDto);
    return await this.customerRepository.save(customer);
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
      where: { status: 'active' }
    });
  }

  /**
   * 根据状态获取客户列表
   */
  async getCustomersByStatus(status: string): Promise<Customer[]> {
    return await this.customerRepository.find({
      where: { status },
      order: { created_at: 'DESC' }
    });
  }
}
