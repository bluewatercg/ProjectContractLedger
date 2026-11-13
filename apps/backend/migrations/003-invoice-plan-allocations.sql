-- 发票与开票计划：从单列关联改为分摊关联（一票可拆多期）
-- Step 1: 创建 invoice_plan_allocations 表
-- Step 2: 迁移存量 invoices.plan_id（一张票整额计入所挂计划）
-- Step 3: 保留 invoices.plan_id 列但不再写入（代码已停止读写，便于回滚）

CREATE TABLE IF NOT EXISTS `invoice_plan_allocations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `kit_id` INT NOT NULL COMMENT '套账ID',
  `invoice_id` INT NOT NULL COMMENT '发票ID',
  `plan_id` INT NOT NULL COMMENT '开票计划ID',
  `allocated_amount` DECIMAL(15,2) NOT NULL COMMENT '计入该计划的开票金额',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  UNIQUE KEY `uk_allocation_invoice_plan` (`invoice_id`, `plan_id`),
  KEY `idx_alloc_invoice_id` (`invoice_id`),
  KEY `idx_alloc_plan_id` (`plan_id`),
  KEY `idx_alloc_kit_id` (`kit_id`),
  CONSTRAINT `FK_alloc_kit` FOREIGN KEY (`kit_id`) REFERENCES `kits`(`id`),
  CONSTRAINT `FK_alloc_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_alloc_plan` FOREIGN KEY (`plan_id`) REFERENCES `contract_invoice_plan`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发票-开票计划分摊表';

-- Step 2: 存量迁移（幂等：已存在的关联不重复插入）
-- 仅迁移未作废发票；作废票保留原 plan_id 字段，不产生分摊记录
INSERT INTO `invoice_plan_allocations`
  (`kit_id`, `invoice_id`, `plan_id`, `allocated_amount`)
SELECT
  i.`kit_id`, i.`id`, i.`plan_id`, i.`total_amount`
FROM `invoices` i
INNER JOIN `contract_invoice_plan` p ON p.`id` = i.`plan_id`
WHERE i.`plan_id` IS NOT NULL
  AND i.`status` <> 'cancelled'
  AND NOT EXISTS (
    SELECT 1 FROM `invoice_plan_allocations` a
    WHERE a.`invoice_id` = i.`id` AND a.`plan_id` = i.`plan_id`
  );

-- Step 3: 依据分摊记录回填计划的已开票金额与状态
UPDATE `contract_invoice_plan` p
SET
  p.`actual_invoiced_amount` = COALESCE((
    SELECT SUM(a.`allocated_amount`)
    FROM `invoice_plan_allocations` a
    INNER JOIN `invoices` i ON i.`id` = a.`invoice_id`
    WHERE a.`plan_id` = p.`id` AND i.`status` <> 'cancelled'
  ), 0),
  p.`status` = CASE
    WHEN COALESCE((
      SELECT SUM(a.`allocated_amount`)
      FROM `invoice_plan_allocations` a
      INNER JOIN `invoices` i ON i.`id` = a.`invoice_id`
      WHERE a.`plan_id` = p.`id` AND i.`status` <> 'cancelled'
    ), 0) <= 0 THEN 'pending'
    WHEN COALESCE((
      SELECT SUM(a.`allocated_amount`)
      FROM `invoice_plan_allocations` a
      INNER JOIN `invoices` i ON i.`id` = a.`invoice_id`
      WHERE a.`plan_id` = p.`id` AND i.`status` <> 'cancelled'
    ), 0) < p.`planned_amount` THEN 'partial_invoiced'
    ELSE 'invoiced'
  END
WHERE p.`status` <> 'cancelled';

-- 校验查询（只读，供上线后人工核对；不修改数据）
-- 1) 分摊合计是否超过发票总额（正常应返回 0 行）
-- SELECT a.invoice_id, SUM(a.allocated_amount) AS allocated, i.total_amount
-- FROM invoice_plan_allocations a JOIN invoices i ON i.id = a.invoice_id
-- GROUP BY a.invoice_id, i.total_amount HAVING allocated > i.total_amount + 0.01;
-- 2) 分摊记录跨合同（正常应返回 0 行）
-- SELECT a.id FROM invoice_plan_allocations a
-- JOIN invoices i ON i.id = a.invoice_id
-- JOIN contract_invoice_plan p ON p.id = a.plan_id
-- WHERE p.contract_id <> i.contract_id;
