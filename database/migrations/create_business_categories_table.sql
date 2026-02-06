-- Migration: create_business_categories_table
-- Date: 2026-02-06
-- Description: Create business_categories table for hierarchical business type management
-- Uses Adjacency List pattern with self-referencing parent_id for N-level tree structure

CREATE TABLE IF NOT EXISTS business_categories (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  kit_id INT NOT NULL COMMENT '套账ID',
  parent_id INT NULL COMMENT '父分类ID，NULL表示根节点',
  name VARCHAR(100) NOT NULL COMMENT '分类名称',
  sort_order INT DEFAULT 0 COMMENT '同级排序序号',
  status ENUM('active', 'disabled') DEFAULT 'active' COMMENT '状态：active-启用，disabled-禁用',
  created_by INT NOT NULL COMMENT '创建人ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  -- Foreign key constraints
  CONSTRAINT fk_business_categories_kit FOREIGN KEY (kit_id) REFERENCES kits(id),
  CONSTRAINT fk_business_categories_parent FOREIGN KEY (parent_id) REFERENCES business_categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_business_categories_creator FOREIGN KEY (created_by) REFERENCES users(id),

  -- Indexes for performance
  INDEX idx_kit_parent (kit_id, parent_id),
  INDEX idx_sort_order (parent_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
