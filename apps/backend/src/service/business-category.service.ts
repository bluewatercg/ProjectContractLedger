import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessCategory } from '../entity/business-category.entity';

/**
 * 业务类型树节点（包含子节点数组）
 */
export interface BusinessCategoryTreeNode extends BusinessCategory {
  children: BusinessCategoryTreeNode[];
}

/**
 * 删除结果
 */
export interface DeleteResult {
  success: boolean;
  message?: string;
  contractCount?: number;
}

/**
 * 业务类型服务
 * 提供树形结构的CRUD操作和节点移动功能
 */
@Provide()
export class BusinessCategoryService {
  @InjectEntityModel(BusinessCategory)
  categoryRepository: Repository<BusinessCategory>;

  /**
   * 获取完整的业务类型树
   * @param kitId 套账ID
   * @param statusFilter 可选的状态过滤（用于下拉框只显示启用的分类）
   * @returns 树形结构的根节点数组
   */
  async getTree(kitId: number, statusFilter?: 'active' | 'disabled'): Promise<BusinessCategoryTreeNode[]> {
    // 构建查询条件
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.kit_id = :kitId', { kitId })
      // MySQL 不支持 "NULLS FIRST"，用 CASE 表达式保证根节点(parent_id IS NULL)优先
      .orderBy('CASE WHEN category.parent_id IS NULL THEN 0 ELSE 1 END', 'ASC')
      .addOrderBy('category.parent_id', 'ASC')
      .addOrderBy('category.sort_order', 'ASC');

    // 可选的状态过滤
    if (statusFilter) {
      queryBuilder.andWhere('category.status = :status', { status: statusFilter });
    }

    const categories = await queryBuilder.getMany();

    // 在内存中构建树结构
    return this.buildTree(categories);
  }

  /**
   * 创建业务类型
   * @param dto 创建数据
   * @param kitId 套账ID
   * @param createdBy 创建人ID
   * @returns 创建的业务类型
   */
  async create(
    dto: { name: string; parent_id?: number },
    kitId: number,
    createdBy: number
  ): Promise<BusinessCategory> {
    // 如果指定了父分类，验证父分类存在且属于同一套账
    if (dto.parent_id) {
      const parent = await this.categoryRepository.findOne({
        where: { id: dto.parent_id, kit_id: kitId },
      });
      if (!parent) {
        throw new Error('父分类不存在');
      }
    }

    // 计算同级排序序号（取同级最大值+1）
    const sortOrder = await this.getNextSortOrder(dto.parent_id || null, kitId);

    // 创建实体
    const category = this.categoryRepository.create({
      name: dto.name,
      parent_id: dto.parent_id || null,
      kit_id: kitId,
      created_by: createdBy,
      sort_order: sortOrder,
      status: 'active',
    });

    return await this.categoryRepository.save(category);
  }

  /**
   * 更新业务类型
   * @param id 分类ID
   * @param dto 更新数据
   * @param kitId 套账ID
   * @returns 更新后的业务类型
   */
  async update(
    id: number,
    dto: { name?: string; status?: 'active' | 'disabled' },
    kitId: number
  ): Promise<BusinessCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id, kit_id: kitId },
    });

    if (!category) {
      throw new Error('分类不存在');
    }

    // 更新字段
    if (dto.name !== undefined) {
      category.name = dto.name;
    }
    if (dto.status !== undefined) {
      category.status = dto.status;
    }

    return await this.categoryRepository.save(category);
  }

  /**
   * 删除业务类型
   * @param id 分类ID
   * @param kitId 套账ID
   * @returns 删除结果
   */
  async delete(id: number, kitId: number): Promise<DeleteResult> {
    const category = await this.categoryRepository.findOne({
      where: { id, kit_id: kitId },
    });

    if (!category) {
      return { success: false, message: '分类不存在' };
    }

    // 检查是否有子分类
    const childrenCount = await this.categoryRepository.count({
      where: { parent_id: id, kit_id: kitId },
    });

    if (childrenCount > 0) {
      return {
        success: false,
        message: '该分类下有子分类，请先删除子分类',
      };
    }

    // 检查关联合同数量（未来实现：查询实际合同数量）
    // 目前返回0，待合同实体添加business_category_id后实现
    const contractCount = await this.getContractCount(id, kitId);
    if (contractCount > 0) {
      return {
        success: false,
        message: `该分类下有 ${contractCount} 个关联合同，无法删除`,
        contractCount,
      };
    }

    // 执行删除
    await this.categoryRepository.delete({ id, kit_id: kitId });
    return { success: true };
  }

  /**
   * 移动节点（拖拽排序）
   * @param nodeId 被移动的节点ID
   * @param targetId 目标节点ID
   * @param dropType 放置类型：prev-放在目标前面，inner-放入目标内部，next-放在目标后面
   * @param kitId 套账ID
   */
  async moveNode(
    nodeId: number,
    targetId: number,
    dropType: 'prev' | 'inner' | 'next',
    kitId: number
  ): Promise<void> {
    // 获取被移动的节点
    const node = await this.categoryRepository.findOne({
      where: { id: nodeId, kit_id: kitId },
    });
    if (!node) {
      throw new Error('节点不存在');
    }

    // 获取目标节点
    const target = await this.categoryRepository.findOne({
      where: { id: targetId, kit_id: kitId },
    });
    if (!target) {
      throw new Error('目标节点不存在');
    }

    // 防止循环引用：检查目标节点是否是被移动节点的子孙节点
    if (dropType === 'inner') {
      const isDescendant = await this.isDescendantOf(targetId, nodeId, kitId);
      if (isDescendant) {
        throw new Error('不能将节点移动到其子节点内部');
      }
    }

    let newParentId: number | null;
    let newSortOrder: number;

    if (dropType === 'inner') {
      // 放入目标内部 - 成为目标的子节点
      newParentId = target.id;
      newSortOrder = await this.getNextSortOrder(newParentId, kitId);
    } else {
      // 放在目标前面或后面 - 与目标同级
      newParentId = target.parent_id;

      if (dropType === 'prev') {
        // 放在目标前面
        newSortOrder = target.sort_order;
        // 将目标及其后面的同级节点的sort_order都+1
        await this.shiftSortOrders(newParentId, newSortOrder, kitId, nodeId);
      } else {
        // 放在目标后面
        newSortOrder = target.sort_order + 1;
        // 将目标后面的同级节点的sort_order都+1
        await this.shiftSortOrders(newParentId, newSortOrder, kitId, nodeId);
      }
    }

    // 更新节点
    node.parent_id = newParentId;
    node.sort_order = newSortOrder;
    await this.categoryRepository.save(node);
  }

  /**
   * 切换状态（启用/禁用）
   * @param id 分类ID
   * @param kitId 套账ID
   * @returns 更新后的业务类型
   */
  async toggleStatus(id: number, kitId: number): Promise<BusinessCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id, kit_id: kitId },
    });

    if (!category) {
      throw new Error('分类不存在');
    }

    // 切换状态
    category.status = category.status === 'active' ? 'disabled' : 'active';
    return await this.categoryRepository.save(category);
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 在内存中构建树结构
   * @param categories 扁平的分类列表
   * @returns 树形结构的根节点数组
   */
  private buildTree(categories: BusinessCategory[]): BusinessCategoryTreeNode[] {
    const categoryMap = new Map<number, BusinessCategoryTreeNode>();
    const roots: BusinessCategoryTreeNode[] = [];

    // 第一遍：创建所有节点的映射，并初始化children数组
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // 第二遍：建立父子关系
    categories.forEach(cat => {
      const node = categoryMap.get(cat.id);
      if (cat.parent_id === null) {
        // 根节点
        roots.push(node);
      } else {
        // 子节点 - 添加到父节点的children中
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children.push(node);
        } else {
          // 父节点不存在（可能被过滤掉了），作为根节点处理
          roots.push(node);
        }
      }
    });

    return roots;
  }

  /**
   * 获取下一个排序序号
   * @param parentId 父分类ID
   * @param kitId 套账ID
   * @returns 下一个排序序号
   */
  private async getNextSortOrder(parentId: number | null, kitId: number): Promise<number> {
    const result = await this.categoryRepository
      .createQueryBuilder('category')
      .select('MAX(category.sort_order)', 'maxOrder')
      .where('category.kit_id = :kitId', { kitId })
      .andWhere(
        parentId === null
          ? 'category.parent_id IS NULL'
          : 'category.parent_id = :parentId',
        parentId === null ? {} : { parentId }
      )
      .getRawOne();

    return (result?.maxOrder ?? -1) + 1;
  }

  /**
   * 移动排序序号（为插入腾出位置）
   * @param parentId 父分类ID
   * @param fromOrder 起始排序序号
   * @param kitId 套账ID
   * @param excludeNodeId 排除的节点ID（被移动的节点本身）
   */
  private async shiftSortOrders(
    parentId: number | null,
    fromOrder: number,
    kitId: number,
    excludeNodeId: number
  ): Promise<void> {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder()
      .update(BusinessCategory)
      .set({ sort_order: () => 'sort_order + 1' })
      .where('kit_id = :kitId', { kitId })
      .andWhere('sort_order >= :fromOrder', { fromOrder })
      .andWhere('id != :excludeNodeId', { excludeNodeId });

    if (parentId === null) {
      queryBuilder.andWhere('parent_id IS NULL');
    } else {
      queryBuilder.andWhere('parent_id = :parentId', { parentId });
    }

    await queryBuilder.execute();
  }

  /**
   * 检查targetId是否是nodeId的子孙节点
   * @param targetId 目标节点ID
   * @param nodeId 祖先节点ID
   * @param kitId 套账ID
   * @returns 是否是子孙节点
   */
  private async isDescendantOf(
    targetId: number,
    nodeId: number,
    kitId: number
  ): Promise<boolean> {
    // 获取目标节点
    let current = await this.categoryRepository.findOne({
      where: { id: targetId, kit_id: kitId },
    });

    // 向上遍历父节点链
    while (current && current.parent_id !== null) {
      if (current.parent_id === nodeId) {
        return true;
      }
      current = await this.categoryRepository.findOne({
        where: { id: current.parent_id, kit_id: kitId },
      });
    }

    return false;
  }

  /**
   * 获取分类关联的合同数量
   * @param categoryId 分类ID
   * @param kitId 套账ID
   * @returns 合同数量
   */
  private async getContractCount(categoryId: number, kitId: number): Promise<number> {
    // TODO: 待合同实体添加business_category_id字段后实现
    // 目前返回0，允许删除
    // 未来实现：
    // return await this.contractRepository.count({
    //   where: { business_category_id: categoryId, kit_id: kitId }
    // });
    return 0;
  }
}
