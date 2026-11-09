const bcrypt = require('bcryptjs');

async function generatePasswordHashes() {
  const users = [
    {
      username: 'admin',
      email: 'admin@example.com',
      password: process.env.INITIAL_ADMIN_PASSWORD,
      fullName: '系统管理员',
      role: 'admin',
    },
    {
      username: 'testuser',
      email: 'test@example.com',
      password: process.env.TEST_USER_PASSWORD,
      fullName: '测试用户',
      role: 'user',
    },
  ];

  if (users.some(user => !user.password)) {
    throw new Error(
      'Set INITIAL_ADMIN_PASSWORD and TEST_USER_PASSWORD in the environment'
    );
  }

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(
      `INSERT INTO users (username, email, password, full_name, role, status) VALUES ('${user.username}', '${user.email}', '${hash}', '${user.fullName}', '${user.role}', 'active');`
    );
  }
}

generatePasswordHashes().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
