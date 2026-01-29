-- 创建对账主表
CREATE TABLE IF NOT EXISTS `reconciliations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kit_id` int NOT NULL,
  `reconciliation_number` varchar(50) NOT NULL,
  `invoice_id` int NOT NULL,
  `invoice_amount` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) NOT NULL,
  `difference_amount` decimal(15,2) NOT NULL,
  `status` enum('matched','partial','overpaid','underpaid','unmatched') NOT NULL DEFAULT 'unmatched',
  `approval_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `difference_reason` text,
  `notes` text,
  `reconciled_by` int DEFAULT NULL,
  `reconciled_at` datetime DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_reconciliation_number` (`reconciliation_number`),
  KEY `IDX_reconciliation_kit_id` (`kit_id`),
  KEY `IDX_reconciliation_invoice_id` (`invoice_id`),
  KEY `IDX_reconciliation_status` (`status`),
  KEY `IDX_reconciliation_approval_status` (`approval_status`),
  CONSTRAINT `FK_reconciliation_kit` FOREIGN KEY (`kit_id`) REFERENCES `kits` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_reconciliation_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_reconciliation_reconciled_by` FOREIGN KEY (`reconciled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_reconciliation_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建对账明细表
CREATE TABLE IF NOT EXISTS `reconciliation_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reconciliation_id` int NOT NULL,
  `payment_id` int NOT NULL,
  `payment_amount` decimal(15,2) NOT NULL,
  `payment_date` datetime NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `is_matched` tinyint(1) NOT NULL DEFAULT '1',
  `notes` text,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_reconciliation_detail_reconciliation_id` (`reconciliation_id`),
  KEY `IDX_reconciliation_detail_payment_id` (`payment_id`),
  CONSTRAINT `FK_reconciliation_detail_reconciliation` FOREIGN KEY (`reconciliation_id`) REFERENCES `reconciliations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_reconciliation_detail_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
