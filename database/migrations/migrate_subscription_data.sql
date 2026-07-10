-- 数据迁移：将现有续费信息从主表迁移到明细表
-- 为每个现有的订阅事项创建一条续费记录

INSERT INTO subscription_renewal_records 
(subscription_id, kit_id, next_reminder_date, remind_days_before, reminder_mode, fee, renewal_method, status, remarks, operated_by, created_at, updated_at)
SELECT 
  sr.id as subscription_id,
  sr.kit_id as kit_id,
  COALESCE(sr.next_reminder_start_date, sr.current_expiry_date) as next_reminder_date,
  COALESCE(sr.remind_days_before, 0) as remind_days_before,
  COALESCE(sr.reminder_mode, 'daily') as reminder_mode,
  sr.fee,
  sr.renewal_url as renewal_method,
  'active' as status,  -- 将现有记录设为生效中
  sr.notes as remarks,  -- 注意：字段名是 notes，不是 remarks
  1 as operated_by,  -- 默认操作人
  sr.created_at,
  sr.updated_at
FROM subscription_records sr
WHERE sr.current_expiry_date IS NOT NULL OR sr.next_reminder_start_date IS NOT NULL;

-- 验证迁移结果
SELECT 
  'subscription_renewal_records count:' as msg,
  COUNT(*) as count
FROM subscription_renewal_records;