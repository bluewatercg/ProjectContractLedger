-- 创建订阅续费记录表
CREATE TABLE IF NOT EXISTS subscription_renewal_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subscription_id INT NOT NULL COMMENT '关联订阅事项ID',
  kit_id INT NOT NULL COMMENT '套账ID',
  renewal_date DATE COMMENT '续费日期',
  next_reminder_date DATE COMMENT '下次提醒时间（开始提醒日期）',
  remind_days_before INT DEFAULT 0 COMMENT '提前几天提醒（业务说明字段）',
  reminder_mode ENUM('daily', 'once') DEFAULT 'daily' COMMENT '提醒方式：daily/once',
  fee DECIMAL(10,2) COMMENT '费用',
  renewal_method VARCHAR(500) COMMENT '续费方式',
  status ENUM('active', 'completed', 'voided') DEFAULT 'active' COMMENT '状态：active/completed/voided',
  remarks TEXT COMMENT '备注',
  operated_by INT COMMENT '操作人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subscription_id (subscription_id),
  INDEX idx_kit_id (kit_id),
  INDEX idx_status (status),
  FOREIGN KEY (subscription_id) REFERENCES subscription_records(id) ON DELETE CASCADE,
  FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE
);

-- 为附件表添加新字段
ALTER TABLE subscription_renewal_attachments 
ADD COLUMN renewal_record_id INT NULL COMMENT '关联续费记录ID' AFTER renewal_log_id;

-- 更新附件表索引
ALTER TABLE subscription_renewal_attachments 
ADD INDEX idx_renewal_record_id (renewal_record_id);

-- 更新附件表外键约束
ALTER TABLE subscription_renewal_attachments 
ADD CONSTRAINT fk_attachment_renewal_record 
FOREIGN KEY (renewal_record_id) REFERENCES subscription_renewal_records(id) ON DELETE CASCADE;