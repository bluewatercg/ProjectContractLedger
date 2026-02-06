# Phase 1: Business Category Infrastructure - Research

**Researched:** 2026-02-06
**Domain:** Hierarchical Data Structures (Tree) with TypeORM + Vue 3 + Element Plus
**Confidence:** HIGH

## Summary

This research investigates how to implement a multi-level tree structure for business categories (业务类型) in the existing Midway.js + Vue 3 + Element Plus codebase. The implementation must support:
- N-level hierarchical tree structure
- Drag-and-drop reordering at any level
- Enable/disable status for categories
- Delete validation against associated contracts
- Multi-tenant isolation via Kit

The standard approach is to use **Adjacency List pattern** (self-referencing entity with `parent_id`) combined with a `sort_order` column for sibling ordering. Element Plus's built-in `el-tree` component with `draggable` attribute provides the drag-and-drop functionality. MySQL 8.0's recursive CTEs enable efficient tree traversal queries when needed.

**Primary recommendation:** Use TypeORM self-referencing relations (Adjacency List) with `parent_id` and `sort_order` columns, combined with Element Plus `el-tree` draggable component. This is the simplest, most flexible approach that aligns with the existing codebase patterns.

## Standard Stack

### Core (Already in Codebase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeORM | ^0.3.17 | ORM with self-referencing relation support | Already used in project, supports tree patterns |
| Element Plus | ^2.4.0 | Tree component with built-in drag-drop | Already used in project, native tree support |
| Vue 3 | ^3.3.0 | Frontend framework | Already used in project |
| MySQL 8.0 | - | Database with recursive CTE support | Already used, supports WITH RECURSIVE |

### Supporting (No additional libraries needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeORM QueryBuilder | Built-in | Complex tree queries | When loading tree with filters |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Adjacency List | Materialized Path (`@Tree("materialized-path")`) | Better read performance but more complex writes and moves |
| Adjacency List | Closure Table (`@Tree("closure-table")`) | Best for deep trees but creates separate table, complex updates |
| Adjacency List | Nested Set | Very efficient reads but terrible for writes/moves - NOT suitable for drag-drop |
| Manual tree loading | TypeORM TreeRepository | TreeRepository doesn't support Adjacency List pattern |

**Installation:**
```bash
# No additional packages needed - all required dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
apps/backend/src/
├── entity/
│   └── business-category.entity.ts     # Tree entity with self-reference
├── controller/
│   └── business-category.controller.ts # REST endpoints
├── service/
│   └── business-category.service.ts    # Business logic + tree operations
└── interface.ts                        # Add DTOs for category

apps/frontend/src/
├── views/
│   └── business-categories/
│       └── BusinessCategoryTree.vue    # Tree management page
├── api/
│   └── business-category.ts            # API client
└── api/types.ts                        # Add TypeScript interfaces
```

### Pattern 1: Adjacency List Entity with Self-Reference
**What:** Entity references itself for parent-child relationship
**When to use:** Any hierarchical category/folder structure with flexible depth
**Example:**
```typescript
// Source: TypeORM self-referencing relations pattern
// apps/backend/src/entity/business-category.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Kit } from './kit.entity';

@Entity('business_categories')
export class BusinessCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '套账ID' })
  kit_id: number;

  @Column({ name: 'parent_id', nullable: true, comment: '父分类ID，NULL表示根节点' })
  parent_id: number | null;

  @Column({ length: 100, comment: '分类名称' })
  name: string;

  @Column({ type: 'int', default: 0, comment: '同级排序序号' })
  sort_order: number;

  @Column({
    type: 'enum',
    enum: ['active', 'disabled'],
    default: 'active',
    comment: '状态：active-启用，disabled-禁用'
  })
  status: string;

  @Column({ comment: '创建人ID' })
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Self-referencing relations
  @ManyToOne(() => BusinessCategory, category => category.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: BusinessCategory;

  @OneToMany(() => BusinessCategory, category => category.parent)
  children: BusinessCategory[];

  // Kit relation (multi-tenant)
  @ManyToOne(() => Kit)
  @JoinColumn({ name: 'kit_id' })
  kit: Kit;
}
```

### Pattern 2: Tree Loading Service Method
**What:** Recursively build tree structure from flat list
**When to use:** Loading complete tree for display
**Example:**
```typescript
// Source: Standard tree-building algorithm
// apps/backend/src/service/business-category.service.ts
async getTree(kitId: number): Promise<BusinessCategory[]> {
  // Load all categories for the kit in one query
  const categories = await this.categoryRepository.find({
    where: { kit_id: kitId },
    order: { parent_id: 'ASC', sort_order: 'ASC' },
  });

  // Build tree structure
  const categoryMap = new Map<number, BusinessCategory & { children: BusinessCategory[] }>();
  const roots: (BusinessCategory & { children: BusinessCategory[] })[] = [];

  // First pass: create map with children arrays
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: build parent-child relationships
  categories.forEach(cat => {
    const node = categoryMap.get(cat.id);
    if (cat.parent_id === null) {
      roots.push(node);
    } else {
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return roots;
}
```

### Pattern 3: Element Plus Draggable Tree
**What:** Vue 3 tree component with drag-drop support
**When to use:** Frontend tree management UI
**Example:**
```vue
<!-- Source: Element Plus Tree documentation -->
<template>
  <el-tree
    :data="treeData"
    node-key="id"
    :props="treeProps"
    draggable
    default-expand-all
    :allow-drag="allowDrag"
    :allow-drop="allowDrop"
    @node-drop="handleDrop"
  >
    <template #default="{ node, data }">
      <span class="tree-node">
        <span>{{ data.name }}</span>
        <span class="tree-node-actions">
          <el-tag v-if="data.status === 'disabled'" size="small" type="info">已禁用</el-tag>
          <el-button size="small" @click.stop="handleEdit(data)">编辑</el-button>
          <el-button size="small" type="primary" @click.stop="handleAddChild(data)">添加子分类</el-button>
          <el-button size="small" type="danger" @click.stop="handleDelete(data)">删除</el-button>
        </span>
      </span>
    </template>
  </el-tree>
</template>

<script setup lang="ts">
const treeProps = {
  label: 'name',
  children: 'children',
}

// Prevent dragging disabled nodes
const allowDrag = (node) => {
  return node.data.status === 'active'
}

// Control where nodes can be dropped
const allowDrop = (draggingNode, dropNode, type) => {
  // Allow drop before/after/inside any active node
  return dropNode.data.status === 'active'
}

// Handle drop event - sync to backend
const handleDrop = async (draggingNode, dropNode, dropType, ev) => {
  const payload = {
    nodeId: draggingNode.data.id,
    targetId: dropNode.data.id,
    dropType: dropType, // 'prev' | 'inner' | 'next'
  }
  await businessCategoryApi.moveNode(payload)
}
</script>
```

### Pattern 4: Move Node API with Sort Order Update
**What:** Backend endpoint to handle node movement
**When to use:** Persisting drag-drop changes
**Example:**
```typescript
// Source: Optimized sort order update pattern
async moveNode(
  nodeId: number,
  targetId: number,
  dropType: 'prev' | 'inner' | 'next',
  kitId: number
): Promise<void> {
  const node = await this.categoryRepository.findOne({
    where: { id: nodeId, kit_id: kitId }
  });
  const target = await this.categoryRepository.findOne({
    where: { id: targetId, kit_id: kitId }
  });

  if (!node || !target) {
    throw new Error('节点不存在');
  }

  // Determine new parent and position
  let newParentId: number | null;
  let newSortOrder: number;

  if (dropType === 'inner') {
    // Drop inside target - becomes child of target
    newParentId = target.id;
    const maxOrder = await this.getMaxSortOrder(target.id, kitId);
    newSortOrder = maxOrder + 1;
  } else {
    // Drop before/after target - same parent as target
    newParentId = target.parent_id;

    // Calculate new sort order based on position
    const siblings = await this.categoryRepository.find({
      where: { parent_id: newParentId, kit_id: kitId },
      order: { sort_order: 'ASC' },
    });

    const targetIndex = siblings.findIndex(s => s.id === target.id);
    if (dropType === 'prev') {
      newSortOrder = target.sort_order;
      // Shift siblings down
      await this.shiftSortOrders(newParentId, newSortOrder, kitId);
    } else {
      newSortOrder = target.sort_order + 1;
      await this.shiftSortOrders(newParentId, newSortOrder, kitId);
    }
  }

  // Update node
  node.parent_id = newParentId;
  node.sort_order = newSortOrder;
  await this.categoryRepository.save(node);
}

private async shiftSortOrders(parentId: number | null, fromOrder: number, kitId: number): Promise<void> {
  await this.categoryRepository
    .createQueryBuilder()
    .update(BusinessCategory)
    .set({ sort_order: () => 'sort_order + 1' })
    .where('parent_id = :parentId AND sort_order >= :fromOrder AND kit_id = :kitId',
      { parentId, fromOrder, kitId })
    .execute();
}
```

### Anti-Patterns to Avoid
- **Loading children recursively with N+1 queries:** Load all nodes in one query, build tree in memory
- **Not validating kit_id on tree operations:** Always include kit_id in WHERE clauses
- **Cascade delete without checking associations:** Check contract count before delete
- **Storing full path in UI state:** Let backend calculate paths if needed
- **Using TypeORM TreeRepository with Adjacency List:** TreeRepository doesn't support Adjacency List

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tree component UI | Custom tree with drag-drop | Element Plus `el-tree` with `draggable` | Handles complex drag-drop edge cases, accessibility |
| Parent-child relations | Custom join tables | TypeORM self-referencing `@ManyToOne`/`@OneToMany` | Built-in relation loading, type safety |
| Tree traversal queries | Recursive application code | MySQL recursive CTE or in-memory tree building | More efficient, database does the work |
| Sort order gaps | Custom compaction algorithm | Accept gaps, only normalize on export/import | Gaps don't affect functionality |

**Key insight:** The combination of TypeORM self-referencing relations + Element Plus draggable tree covers 95% of hierarchical data UI needs. Custom solutions add complexity without proportional benefit.

## Common Pitfalls

### Pitfall 1: N+1 Query Problem When Loading Tree
**What goes wrong:** Loading children one parent at a time creates many database queries
**Why it happens:** Eager loading or recursive findOne calls
**How to avoid:** Load all nodes in single query, build tree structure in application memory
**Warning signs:** Slow tree loading, database connection pool exhaustion

### Pitfall 2: Orphaned Children on Delete
**What goes wrong:** Deleting a parent leaves children with invalid parent_id
**Why it happens:** Not considering cascade behavior or child nodes
**How to avoid:** Either: (1) Prevent delete if has children, (2) Recursively delete children, or (3) Re-parent children to grandparent
**Warning signs:** Foreign key constraint errors, nodes disappearing from tree

### Pitfall 3: Sort Order Overflow/Collision
**What goes wrong:** Multiple nodes get same sort_order after many moves
**Why it happens:** Not properly shifting sibling sort orders on insert
**How to avoid:** Shift existing sort_orders when inserting, use transaction for atomicity
**Warning signs:** Inconsistent node ordering, nodes jumping positions

### Pitfall 4: Forgetting Kit Isolation in Tree Operations
**What goes wrong:** Users see or modify categories from other tenants
**Why it happens:** Missing kit_id filter in queries
**How to avoid:** ALWAYS include `kit_id` in WHERE clauses, add it to all query builders
**Warning signs:** Categories appearing that weren't created by current user

### Pitfall 5: Circular Reference in Tree Data
**What goes wrong:** Node becomes its own ancestor, causing infinite loops
**Why it happens:** Not validating that new parent is not a descendant of moved node
**How to avoid:** Before moving, verify target is not in the subtree of the moved node
**Warning signs:** Browser freezing, stack overflow errors

### Pitfall 6: Deleting Category with Associated Contracts
**What goes wrong:** Contracts lose their category reference, causing data integrity issues
**Why it happens:** Not checking contract associations before delete
**How to avoid:** Query contract count before delete, return error with count if > 0
**Warning signs:** NULL category on contracts, orphaned data

## Code Examples

### Database Schema (Migration)
```sql
-- Source: Best practices for hierarchical data + existing codebase patterns
CREATE TABLE business_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kit_id INT NOT NULL,
  parent_id INT NULL,
  name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  status ENUM('active', 'disabled') DEFAULT 'active',
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (kit_id) REFERENCES kits(id),
  FOREIGN KEY (parent_id) REFERENCES business_categories(id) ON DELETE RESTRICT,

  INDEX idx_kit_parent (kit_id, parent_id),
  INDEX idx_sort_order (parent_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Contract Entity Update (Reference)
```typescript
// Add to contracts entity for future phase
@Column({ name: 'business_category_id', nullable: true, comment: '业务类型ID' })
business_category_id: number | null;

@ManyToOne(() => BusinessCategory)
@JoinColumn({ name: 'business_category_id' })
business_category: BusinessCategory;
```

### Delete with Association Check
```typescript
// Source: Delete validation pattern
async deleteCategory(id: number, kitId: number): Promise<{ success: boolean; message?: string; contractCount?: number }> {
  const category = await this.categoryRepository.findOne({
    where: { id, kit_id: kitId },
    relations: ['children'],
  });

  if (!category) {
    return { success: false, message: '分类不存在' };
  }

  // Check for children
  if (category.children && category.children.length > 0) {
    return {
      success: false,
      message: '该分类下有子分类，请先删除子分类'
    };
  }

  // Check for associated contracts (future: use actual contract count)
  const contractCount = await this.getContractCount(id, kitId);
  if (contractCount > 0) {
    return {
      success: false,
      message: `该分类下有 ${contractCount} 个关联合同，无法删除`,
      contractCount,
    };
  }

  await this.categoryRepository.delete({ id, kit_id: kitId });
  return { success: true };
}
```

### Frontend API Client
```typescript
// Source: Existing codebase API patterns (see customer.ts)
// apps/frontend/src/api/business-category.ts
import apiClient from './config'
import type { ApiResponse, BusinessCategory, CreateBusinessCategoryDto, UpdateBusinessCategoryDto, MoveNodeDto } from './types'

export const businessCategoryApi = {
  // Get full tree for current kit
  getTree(): Promise<ApiResponse<BusinessCategory[]>> {
    return apiClient.get('/business-categories/tree').then(res => res.data)
  },

  // Get active categories only (for dropdowns)
  getActiveTree(): Promise<ApiResponse<BusinessCategory[]>> {
    return apiClient.get('/business-categories/tree', { params: { status: 'active' } }).then(res => res.data)
  },

  // Create category
  create(data: CreateBusinessCategoryDto): Promise<ApiResponse<BusinessCategory>> {
    return apiClient.post('/business-categories', data).then(res => res.data)
  },

  // Update category
  update(id: number, data: UpdateBusinessCategoryDto): Promise<ApiResponse<BusinessCategory>> {
    return apiClient.put(`/business-categories/${id}`, data).then(res => res.data)
  },

  // Move node (drag-drop)
  moveNode(data: MoveNodeDto): Promise<ApiResponse<void>> {
    return apiClient.post('/business-categories/move', data).then(res => res.data)
  },

  // Delete category
  delete(id: number): Promise<ApiResponse<{ contractCount?: number }>> {
    return apiClient.delete(`/business-categories/${id}`).then(res => res.data)
  },

  // Toggle status
  toggleStatus(id: number): Promise<ApiResponse<BusinessCategory>> {
    return apiClient.patch(`/business-categories/${id}/toggle-status`).then(res => res.data)
  },
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Nested Set for tree hierarchies | Adjacency List with recursive CTE | MySQL 8.0 (2018) | Much simpler writes, acceptable read performance |
| Custom drag-drop libraries | Element Plus built-in draggable | Element Plus 2.x | Less code, better integration |
| Separate sort_order table | Inline sort_order column | - | Simpler schema, fewer joins |

**Deprecated/outdated:**
- TypeORM TreeRepository for Adjacency List: TreeRepository only supports Nested Set, Materialized Path, and Closure Table
- vue.draggable v2: Not compatible with Vue 3, use vue-draggable-plus if custom drag needed (not needed here)

## Open Questions

1. **Contract association in Phase 1 vs later phases**
   - What we know: Phase 1 requirements don't explicitly mention adding category to contracts
   - What's unclear: Whether to add `business_category_id` column to contracts now or in a later phase
   - Recommendation: Add the column and relation now (nullable), but UI integration for contract form can be deferred. This allows delete validation to work correctly.

2. **Max tree depth**
   - What we know: Requirements say "N-level" support
   - What's unclear: Whether there should be a practical limit (e.g., 10 levels)
   - Recommendation: Implement without hard limit, but UI may become unwieldy beyond 5-6 levels. Consider soft warning in UI if depth exceeds threshold.

## Sources

### Primary (HIGH confidence)
- [TypeORM Tree Entities Documentation](https://typeorm.io/docs/entity/tree-entities/) - Tree patterns, decorators, limitations
- [Element Plus Tree Component](https://element-plus.org/en-US/component/tree) - Draggable attribute, events, allow-drag/allow-drop
- Existing codebase files: `customer.entity.ts`, `customer.service.ts`, `CustomerList.vue`, `interface.ts` - Established patterns

### Secondary (MEDIUM confidence)
- [Managing Hierarchical Data in MySQL](https://mikehillyer.com/articles/managing-hierarchical-data-in-mysql/) - Adjacency list vs nested set trade-offs
- [TypeORM Self-Referencing Relations](https://typeorm.io/docs/relations/relations-faq/) - Pattern for categories
- WebSearch: Element Plus draggable tree Vue 3 patterns - Verified against official docs

### Tertiary (LOW confidence)
- Medium article on Materialized Path trees - General concepts, not project-specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies, well-documented patterns
- Architecture: HIGH - Following existing codebase patterns exactly
- Pitfalls: HIGH - Common issues verified against multiple sources
- Code examples: MEDIUM - Based on patterns, needs implementation validation

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (30 days - stable domain)
