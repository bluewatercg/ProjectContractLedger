const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(`Password: ${password}`);
  console.log(`Hashed Password: ${hashedPassword}`);
}

generateHash();
