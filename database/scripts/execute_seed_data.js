const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库配置
const DB_CONFIG = {
  host: 'mysql.sqlpub.com',
  port: 3306,
  user: 'millerchen',
  password: 'c3TyBrus2OmLeeIu',
  database: 'procontractledger',
  multipleStatements: true
};

async function executeSeedData() {
  let connection;
  
  try {
    console.log('🔗 连接数据库...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    console.log('📄 读取种子数据脚本...');
    const seedDataPath = path.join(__dirname, 'seed_data_v2.sql');
    const seedSQL = fs.readFileSync(seedDataPath, 'utf8');
    
    // 移除注释和空行，分割SQL语句
    const statements = seedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'))
      .filter(stmt => !stmt.match(/^\/\*[\s\S]*?\*\/$/));
    
    console.log(`📊 找到 ${statements.length} 条SQL语句`);
    
    // 逐个执行SQL语句
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // 跳过SELECT语句（它们只是显示信息）
      if (stmt.toUpperCase().startsWith('SELECT')) {
        try {
          const [rows] = await connection.execute(stmt);
          if (rows.length > 0) {
            console.log(`📋 ${i + 1}/${statements.length}:`, rows[0]);
          }
        } catch (error) {
          // 忽略SELECT语句的错误
          console.log(`ℹ️  跳过显示语句: ${error.message}`);
        }
        continue;
      }
      
      try {
        await connection.execute(stmt);
        console.log(`✅ ${i + 1}/${statements.length}: SQL执行成功`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  ${i + 1}/${statements.length}: 数据已存在，跳过`);
        } else {
          console.error(`❌ ${i + 1}/${statements.length}: 执行失败:`, error.message);
          // 继续执行其他语句，不中断
        }
      }
    }
    
    // 验证数据插入结果
    console.log('\n📊 验证数据插入结果...');
    
    const [customers] = await connection.execute('SELECT COUNT(*) as count FROM customers');
    const [contracts] = await connection.execute('SELECT COUNT(*) as count FROM contracts');
    const [invoices] = await connection.execute('SELECT COUNT(*) as count FROM invoices');
    const [payments] = await connection.execute('SELECT COUNT(*) as count FROM payments');
    
    console.log('📈 数据统计:');
    console.log(`   - 客户: ${customers[0].count}`);
    console.log(`   - 合同: ${contracts[0].count}`);
    console.log(`   - 发票: ${invoices[0].count}`);
    console.log(`   - 支付: ${payments[0].count}`);
    
    // 验证续签字段
    const [renewableContracts] = await connection.execute(`
      SELECT 
        is_renewable,
        renewal_reminder_days,
        COUNT(*) as count 
      FROM contracts 
      GROUP BY is_renewable, renewal_reminder_days
    `);
    
    console.log('\n🔄 续签合同配置:');
    renewableContracts.forEach(row => {
      const type = row.is_renewable ? '续签合同' : '一次性合同';
      console.log(`   - ${type} (提醒${row.renewal_reminder_days || '未设置'}天): ${row.count}个`);
    });
    
    console.log('\n✅ 种子数据执行完成！');
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔚 数据库连接已关闭');
    }
  }
}

// 执行脚本
if (require.main === module) {
  console.log('🚀 开始执行种子数据脚本...\n');
  executeSeedData();
}

module.exports = { executeSeedData };