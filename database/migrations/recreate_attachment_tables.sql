-- 重新创建附件表的迁移脚本
-- 删除并重新创建 contract_attachments 和 invoice_attachments 表，包含完整字段

USE procontractledger;

-- 备份现有数据（如果需要保留）
-- CREATE TABLE contract_attachments_backup AS SELECT * FROM contract_attachments;
-- CREATE TABLE invoice_attachments_backup AS SELECT * FROM invoice_attachments;

-- 删除现有的附件表
DROP TABLE IF EXISTS contract_attachments;
DROP TABLE IF EXISTS invoice_attachments;

-- 重新创建 contract_attachments 表
CREATE TABLE contract_attachments (
    attachment_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '附件ID',
    contract_id INT NOT NULL COMMENT '合同ID',
    file_name VARCHAR(255) NOT NULL COMMENT '文件名',
    file_path VARCHAR(255) NOT NULL COMMENT '文件路径',
    file_type VARCHAR(50) NULL COMMENT '文件类型',
    file_size INT NULL COMMENT '文件大小(字节)',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
    INDEX idx_contract_id (contract_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同附件表';

-- 重新创建 invoice_attachments 表
CREATE TABLE invoice_attachments (
    attachment_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '附件ID',
    invoice_id INT NOT NULL COMMENT '发票ID',
    file_name VARCHAR(255) NOT NULL COMMENT '文件名',
    file_path VARCHAR(255) NOT NULL COMMENT '文件路径',
    file_type VARCHAR(50) NULL COMMENT '文件类型',
    file_size INT NULL COMMENT '文件大小(字节)',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_invoice_id (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发票附件表';

-- 如果需要恢复备份数据，可以执行以下语句（需要手动调整字段）
-- INSERT INTO contract_attachments (contract_id, file_name, file_path, file_type, uploaded_at)
-- SELECT contract_id, file_name, file_path, 
--        CASE 
--            WHEN file_name LIKE '%.pdf' THEN '.pdf'
--            WHEN file_name LIKE '%.doc' THEN '.doc'
--            WHEN file_name LIKE '%.docx' THEN '.docx'
--            WHEN file_name LIKE '%.jpg' THEN '.jpg'
--            WHEN file_name LIKE '%.jpeg' THEN '.jpeg'
--            WHEN file_name LIKE '%.png' THEN '.png'
--            ELSE SUBSTRING(file_name, LOCATE('.', file_name))
--        END as file_type,
--        uploaded_at
-- FROM contract_attachments_backup;

-- INSERT INTO invoice_attachments (invoice_id, file_name, file_path, file_type, uploaded_at)
-- SELECT invoice_id, file_name, file_path,
--        CASE 
--            WHEN file_name LIKE '%.pdf' THEN '.pdf'
--            WHEN file_name LIKE '%.doc' THEN '.doc'
--            WHEN file_name LIKE '%.docx' THEN '.docx'
--            WHEN file_name LIKE '%.jpg' THEN '.jpg'
--            WHEN file_name LIKE '%.jpeg' THEN '.jpeg'
--            WHEN file_name LIKE '%.png' THEN '.png'
--            ELSE SUBSTRING(file_name, LOCATE('.', file_name))
--        END as file_type,
--        uploaded_at
-- FROM invoice_attachments_backup;

-- 验证表结构
SELECT 'contract_attachments表结构:' as info;
DESCRIBE contract_attachments;

SELECT 'invoice_attachments表结构:' as info;
DESCRIBE invoice_attachments;

-- 检查表数据
SELECT 'contract_attachments数据统计:' as info;
SELECT COUNT(*) as record_count FROM contract_attachments;

SELECT 'invoice_attachments数据统计:' as info;
SELECT COUNT(*) as record_count FROM invoice_attachments;

-- 显示迁移完成信息
SELECT 'Tables recreated successfully!' as status;
