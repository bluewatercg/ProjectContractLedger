const bcrypt = require('bcryptjs');

async function generatePasswordHashes() {
    console.log('生成密码哈希值...\n');
    
    // 生成admin密码哈希 (密码: admin123)
    const adminPassword = 'admin123';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    console.log(`Admin密码: ${adminPassword}`);
    console.log(`Admin哈希: ${adminHash}\n`);
    
    // 生成测试用户密码哈希 (密码: user123)
    const userPassword = 'user123';
    const userHash = await bcrypt.hash(userPassword, 10);
    console.log(`User密码: ${userPassword}`);
    console.log(`User哈希: ${userHash}\n`);
    
    // 验证哈希是否正确
    console.log('验证哈希值:');
    console.log(`Admin密码验证: ${await bcrypt.compare(adminPassword, adminHash)}`);
    console.log(`User密码验证: ${await bcrypt.compare(userPassword, userHash)}`);
    
    // 生成SQL插入语句
    console.log('\n=== SQL插入语句 ===');
    console.log(`-- 管理员用户 (用户名: admin, 密码: ${adminPassword})`);
    console.log(`INSERT INTO users (username, email, password, full_name, role, status) VALUES`);
    console.log(`('admin', 'admin@example.com', '${adminHash}', '系统管理员', 'admin', 'active');`);
    console.log('');
    console.log(`-- 测试用户 (用户名: testuser, 密码: ${userPassword})`);
    console.log(`INSERT INTO users (username, email, password, full_name, role, status) VALUES`);
    console.log(`('testuser', 'test@example.com', '${userHash}', '测试用户', 'user', 'active');`);
}

// 检查是否安装了bcryptjs
try {
    generatePasswordHashes().catch(console.error);
} catch (error) {
    console.error('错误: 请先安装bcryptjs依赖');
    console.error('运行: npm install bcryptjs');
    console.error('或者: yarn add bcryptjs');
}
