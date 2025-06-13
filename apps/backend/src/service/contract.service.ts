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
   * 获取合同列表（分页）
   */
  async getContracts(
    query: PaginationQuery & { customerId?: number; status?: string }
  ): Promise<PaginationResult<any>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      customerId,
      status,
    } = query;

    const queryBuilder = this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.customer', 'customer');

    // 过滤条件
    if (customerId) {
      queryBuilder.andWhere('contract.customer_id = :customerId', {
        customerId,
      });
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

    // 格式化返回数据，处理日期字段
    const formattedItems = items.map(item => this.formatContractResponse(item));

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
  async getContractStats(): Promise<any> {
    const result = await this.contractRepository
      .createQueryBuilder('contract')
      .select([
        'COUNT(*) as total',
        "SUM(CASE WHEN contract.status = 'active' THEN 1 ELSE 0 END) as active",
        "SUM(CASE WHEN contract.status = 'completed' THEN 1 ELSE 0 END) as completed",
        "SUM(CASE WHEN contract.status = 'draft' THEN 1 ELSE 0 END) as draft",
        "SUM(CASE WHEN contract.status IN ('active', 'completed') THEN contract.total_amount ELSE 0 END) as totalAmount",
      ])
      .getRawOne();

    return {
      total: parseInt(result.total) || 0,
      active: parseInt(result.active) || 0,
      completed: parseInt(result.completed) || 0,
      draft: parseInt(result.draft) || 0,
      totalAmount: parseFloat(result.totalAmount) || 0,
    };
  }
}
