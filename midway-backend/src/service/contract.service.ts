import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../entity/contract.entity';
import { CreateContractDto, UpdateContractDto, PaginationQuery, PaginationResult } from '../interface';

@Provide()
export class ContractService {
  @InjectEntityModel(Contract)
  contractRepository: Repository<Contract>;

  /**
   * 创建合同
   */
  async createContract(createContractDto: CreateContractDto): Promise<Contract> {
    // 生成合同编号
    const contractNumber = await this.generateContractNumber();
    
    const contract = this.contractRepository.create({
      ...createContractDto,
      contract_number: contractNumber
    });
    
    return await this.contractRepository.save(contract);
  }

  /**
   * 获取合同列表（分页）
   */
  async getContracts(query: PaginationQuery & { customerId?: number; status?: string }): Promise<PaginationResult<Contract>> {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC', customerId, status } = query;
    
    const queryBuilder = this.contractRepository.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer');
    
    // 过滤条件
    if (customerId) {
      queryBuilder.andWhere('contract.customer_id = :customerId', { customerId });
    }
    
    if (status) {
      queryBuilder.andWhere('contract.status = :status', { status });
    }
    
    // 排序
    queryBuilder.orderBy(`contract.${sortBy}`, sortOrder);
    
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
   * 根据ID获取合同
   */
  async getContractById(id: number): Promise<Contract | null> {
    return await this.contractRepository.findOne({
      where: { id },
      relations: ['customer', 'invoices']
    });
  }

  /**
   * 更新合同
   */
  async updateContract(id: number, updateContractDto: UpdateContractDto): Promise<Contract | null> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    
    if (!contract) {
      return null;
    }
    
    Object.assign(contract, updateContractDto);
    return await this.contractRepository.save(contract);
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
   * 获取合同统计信息
   */
  async getContractStats(): Promise<any> {
    const total = await this.contractRepository.count();
    const active = await this.contractRepository.count({ where: { status: 'active' } });
    const completed = await this.contractRepository.count({ where: { status: 'completed' } });
    const draft = await this.contractRepository.count({ where: { status: 'draft' } });
    
    // 计算总金额
    const totalAmountResult = await this.contractRepository
      .createQueryBuilder('contract')
      .select('SUM(contract.total_amount)', 'total')
      .where('contract.status IN (:...statuses)', { statuses: ['active', 'completed'] })
      .getRawOne();
    
    return {
      total,
      active,
      completed,
      draft,
      totalAmount: parseFloat(totalAmountResult.total) || 0
    };
  }
}
