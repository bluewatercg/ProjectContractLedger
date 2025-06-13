/**
 * MySQL 索引应用脚本
 * 自动连接到 MySQL 数据库并应用性能优化索引
 */

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

/**
 * 应用数据库索引
 */
async function applyIndexes() {
  let connection;
  
  try {
    console.log('🔗 连接到 MySQL 数据库...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ 数据库连接成功');

    // 读取索引SQL文件
    const sqlFile = path.join(__dirname, '../migrations/add_performance_indexes.sql');
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`索引文件不存在: ${sqlFile}`);
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('📄 读取索引脚本文件成功');

    // 分割SQL语句
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== 'USE procontractledger');

    console.log(`📊 准备执行 ${statements.length} 个SQL语句...\n`);

    // 执行每个SQL语句
    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (!statement) continue;

      try {
        console.log(`[${i + 1}/${statements.length}] 执行: ${statement.substring(0, 60)}...`);
        await connection.execute(statement);
        console.log('✅ 成功');
        successCount++;
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log('⚠️  索引已存在，跳过');
          skipCount++;
        } else {
          console.error('❌ 失败:', error.message);
          throw error;
        }
      }
    }

    console.log('\n📈 执行结果:');
    console.log(`✅ 成功: ${successCount}`);
    console.log(`⚠️  跳过: ${skipCount}`);
    console.log(`📊 总计: ${statements.length}`);

    // 验证索引创建
    console.log('\n🔍 验证索引创建...');
    await verifyIndexes(connection);

  } catch (error) {
    console.error('❌ 应用索引失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

/**
 * 验证索引是否创建成功
 */
async function verifyIndexes(connection) {
  const tables = ['customers', 'contracts', 'invoices', 'payments'];
  
  for (const table of tables) {
    try {
      const [rows] = await connection.execute(`SHOW INDEX FROM ${table}`);
      const indexes = rows.filter(row => row.Key_name !== 'PRIMARY');
      console.log(`📋 ${table} 表索引数量: ${indexes.length}`);
      
      if (indexes.length > 0) {
        indexes.forEach(index => {
          console.log(`   - ${index.Key_name} (${index.Column_name})`);
        });
      }
    } catch (error) {
      console.error(`❌ 检查 ${table} 表索引失败:`, error.message);
    }
  }
}

/**
 * 测试数据库连接
 */
async function testConnection() {
  try {
    console.log('🧪 测试数据库连接...');
    const connection = await mysql.createConnection(DB_CONFIG);
    
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ 数据库连接测试成功');
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    return false;
  }
}

/**
 * 显示当前数据库信息
 */
async function showDatabaseInfo() {
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    
    console.log('📊 数据库信息:');
    
    // 数据库版本
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    console.log(`   MySQL 版本: ${versionRows[0].version}`);
    
    // 表信息
    const [tableRows] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${DB_CONFIG.database}'
      AND TABLE_TYPE = 'BASE TABLE'
    `);
    
    console.log('   表信息:');
    tableRows.forEach(table => {
      const dataSize = (table.DATA_LENGTH / 1024).toFixed(2);
      const indexSize = (table.INDEX_LENGTH / 1024).toFixed(2);
      console.log(`     ${table.TABLE_NAME}: ${table.TABLE_ROWS} 行, 数据 ${dataSize}KB, 索引 ${indexSize}KB`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ 获取数据库信息失败:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 MySQL 性能优化索引应用工具');
  console.log('=' .repeat(50));
  
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testConnection();
    return;
  }
  
  if (args.includes('--info')) {
    await showDatabaseInfo();
    return;
  }
  
  if (args.includes('--help')) {
    console.log('使用方法:');
    console.log('  node apply-mysql-indexes.js          # 应用索引');
    console.log('  node apply-mysql-indexes.js --test   # 测试连接');
    console.log('  node apply-mysql-indexes.js --info   # 显示数据库信息');
    console.log('  node apply-mysql-indexes.js --help   # 显示帮助');
    return;
  }
  
  // 先测试连接
  const connected = await testConnection();
  if (!connected) {
    console.log('\n请检查数据库配置和网络连接');
    return;
  }
  
  console.log('');
  await showDatabaseInfo();
  
  console.log('\n' + '=' .repeat(50));
  await applyIndexes();
  
  console.log('\n🎉 索引应用完成！');
  console.log('现在可以重启应用并测试性能改进效果。');
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('💥 程序执行失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  applyIndexes,
  testConnection,
  showDatabaseInfo
};
