#!/usr/bin/env node

/**
 * 文件上传问题调试脚本
 * 用于诊断上传成功但预览失败的问题
 */

const fs = require('fs');
const path = require('path');

console.log('=== 文件上传问题调试脚本 ===\n');

// 1. 检查上传目录配置
console.log('1. 检查上传目录配置:');
const uploadDir = process.env.UPLOAD_DIR || '/app/uploads';
console.log(`   配置的上传目录: ${uploadDir}`);
console.log(`   目录是否存在: ${fs.existsSync(uploadDir)}`);

if (fs.existsSync(uploadDir)) {
    try {
        const stats = fs.statSync(uploadDir);
        console.log(`   目录权限: ${stats.mode.toString(8)}`);
        console.log(`   是否可写: ${fs.constants.W_OK & stats.mode ? '是' : '否'}`);
        
        // 检查子目录
        const subDirs = ['contracts', 'invoices'];
        subDirs.forEach(subDir => {
            const fullPath = path.join(uploadDir, subDir);
            console.log(`   ${subDir}目录存在: ${fs.existsSync(fullPath)}`);
            if (fs.existsSync(fullPath)) {
                const files = fs.readdirSync(fullPath, { withFileTypes: true });
                console.log(`   ${subDir}目录内容: ${files.length} 项`);
                files.forEach(file => {
                    if (file.isDirectory()) {
                        const subPath = path.join(fullPath, file.name);
                        const subFiles = fs.readdirSync(subPath);
                        console.log(`     - ${file.name}/ (${subFiles.length} 个文件)`);
                        subFiles.forEach(subFile => {
                            const filePath = path.join(subPath, subFile);
                            const fileStats = fs.statSync(filePath);
                            console.log(`       * ${subFile} (${fileStats.size} bytes)`);
                        });
                    }
                });
            }
        });
    } catch (error) {
        console.log(`   检查目录时出错: ${error.message}`);
    }
}

console.log('\n2. 检查临时目录:');
const tmpDir = process.env.TMPDIR || '/tmp';
console.log(`   临时目录: ${tmpDir}`);
console.log(`   临时目录存在: ${fs.existsSync(tmpDir)}`);

console.log('\n3. 检查环境变量:');
const envVars = [
    'NODE_ENV',
    'UPLOAD_DIR', 
    'TMPDIR',
    'LOG_LEVEL'
];
envVars.forEach(envVar => {
    console.log(`   ${envVar}: ${process.env[envVar] || '未设置'}`);
});

console.log('\n4. 测试文件操作:');
try {
    // 测试创建目录
    const testDir = path.join(uploadDir, 'test');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
        console.log(`   ✓ 成功创建测试目录: ${testDir}`);
    }
    
    // 测试创建文件
    const testFile = path.join(testDir, 'test.txt');
    fs.writeFileSync(testFile, 'test content');
    console.log(`   ✓ 成功创建测试文件: ${testFile}`);
    
    // 测试读取文件
    const content = fs.readFileSync(testFile, 'utf8');
    console.log(`   ✓ 成功读取测试文件: ${content}`);
    
    // 清理测试文件
    fs.unlinkSync(testFile);
    fs.rmdirSync(testDir);
    console.log(`   ✓ 成功清理测试文件和目录`);
    
} catch (error) {
    console.log(`   ✗ 文件操作测试失败: ${error.message}`);
}

console.log('\n5. 检查路径生成逻辑:');
// 模拟路径生成
function generateFilePath(entityId, originalName, type = 'contracts') {
    const baseUploadDir = process.env.UPLOAD_DIR || '/app/uploads';
    const uploadDir = path.join(baseUploadDir, type, entityId.toString());
    
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const fileName = `${baseName}_${timestamp}${ext}`;
    
    return path.join(uploadDir, fileName);
}

const testPaths = [
    { id: 1, name: 'test.pdf', type: 'contracts' },
    { id: 2, name: 'invoice.jpg', type: 'invoices' }
];

testPaths.forEach(test => {
    const generatedPath = generateFilePath(test.id, test.name, test.type);
    console.log(`   ${test.type}/${test.id}/${test.name} -> ${generatedPath}`);
    console.log(`   目录存在: ${fs.existsSync(path.dirname(generatedPath))}`);
});

console.log('\n=== 调试完成 ===');

// 输出建议
console.log('\n建议检查项目:');
console.log('1. 确认Docker容器的卷挂载配置正确');
console.log('2. 检查上传接口的错误处理和日志输出');
console.log('3. 验证文件上传后是否正确保存到数据库');
console.log('4. 检查预览接口的文件路径查询逻辑');
