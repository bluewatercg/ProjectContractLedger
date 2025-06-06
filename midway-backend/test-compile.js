// 编译测试脚本
const { spawn } = require('child_process');

console.log('🔧 开始编译测试...\n');

const compile = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true
});

compile.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ 编译成功！');
  } else {
    console.log('\n❌ 编译失败，退出码:', code);
  }
  process.exit(code);
});
