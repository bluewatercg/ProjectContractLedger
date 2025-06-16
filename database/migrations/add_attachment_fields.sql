-- 添加附件表缺失字段的迁移脚本
-- 为 contract_attachments 和 invoice_attachments 表添加 file_type 和 file_size 字段

USE procontractledger;

-- 检查并添加 contract_attachments 表的字段
-- 添加 file_type 字段
ALTER TABLE contract_attachments 
ADD COLUMN IF NOT EXISTS file_type VARCHAR(50) NULL COMMENT '文件类型' 
AFTER file_path;

-- 添加 file_size 字段
ALTER TABLE contract_attachments 
ADD COLUMN IF NOT EXISTS file_size INT NULL COMMENT '文件大小(字节)' 
AFTER file_type;

-- 检查并添加 invoice_attachments 表的字段
-- 添加 file_type 字段
ALTER TABLE invoice_attachments 
ADD COLUMN IF NOT EXISTS file_type VARCHAR(50) NULL COMMENT '文件类型' 
AFTER file_path;

-- 添加 file_size 字段
ALTER TABLE invoice_attachments 
ADD COLUMN IF NOT EXISTS file_size INT NULL COMMENT '文件大小(字节)' 
AFTER file_type;

-- 更新现有记录的 file_type（从文件名推断）
UPDATE contract_attachments 
SET file_type = CASE 
    WHEN file_name LIKE '%.pdf' THEN '.pdf'
    WHEN file_name LIKE '%.doc' THEN '.doc'
    WHEN file_name LIKE '%.docx' THEN '.docx'
    WHEN file_name LIKE '%.jpg' THEN '.jpg'
    WHEN file_name LIKE '%.jpeg' THEN '.jpeg'
    WHEN file_name LIKE '%.png' THEN '.png'
    ELSE SUBSTRING(file_name, LOCATE('.', file_name))
END
WHERE file_type IS NULL;

UPDATE invoice_attachments 
SET file_type = CASE 
    WHEN file_name LIKE '%.pdf' THEN '.pdf'
    WHEN file_name LIKE '%.doc' THEN '.doc'
    WHEN file_name LIKE '%.docx' THEN '.docx'
    WHEN file_name LIKE '%.jpg' THEN '.jpg'
    WHEN file_name LIKE '%.jpeg' THEN '.jpeg'
    WHEN file_name LIKE '%.png' THEN '.png'
    ELSE SUBSTRING(file_name, LOCATE('.', file_name))
END
WHERE file_type IS NULL;

-- 验证字段是否添加成功
SELECT 'contract_attachments表结构:' as info;
DESCRIBE contract_attachments;

SELECT 'invoice_attachments表结构:' as info;
DESCRIBE invoice_attachments;

-- 显示迁移完成信息
SELECT 'Migration completed successfully!' as status;
