-- 添加当前活跃续费记录引用字段
ALTER TABLE subscription_records 
ADD COLUMN active_renewal_record_id INT NULL COMMENT '当前活跃续费记录ID' AFTER id;

-- 添加外键约束
ALTER TABLE subscription_records 
ADD CONSTRAINT fk_subscription_active_renewal_record 
FOREIGN KEY (active_renewal_record_id) REFERENCES subscription_renewal_records(id) ON DELETE SET NULL;

-- 添加索引
ALTER TABLE subscription_records 
ADD INDEX idx_active_renewal_record_id (active_renewal_record_id);