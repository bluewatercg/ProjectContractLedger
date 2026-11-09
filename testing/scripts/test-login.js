const axios = require('axios');
const crypto = require('crypto');

async function testLogin() {
  const baseURL = 'http://localhost:8080/api/v1';
  const username = process.env.TEST_LOGIN_USERNAME || 'admin';
  const password = process.env.TEST_LOGIN_PASSWORD;
  if (!password) {
    throw new Error('Set TEST_LOGIN_PASSWORD before running this test');
  }

  console.log('Starting login tests...\n');

  const loginResponse = await axios.post(`${baseURL}/auth/login`, {
    username,
    password,
  });

  if (!loginResponse.data.success) {
    throw new Error(`Login failed: ${loginResponse.data.message}`);
  }

  console.log('Login succeeded.');
  const token = loginResponse.data.data.token;

  try {
    await axios.get(`${baseURL}/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Protected API request succeeded.');
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Token verification failed');
    }
    console.log('Token accepted; protected API returned a non-auth error.');
  }

  let invalidLoginResponse;
  try {
    invalidLoginResponse = await axios.post(`${baseURL}/auth/login`, {
      username,
      password: crypto.randomBytes(24).toString('hex'),
    });
  } catch (error) {
    if (!error.response) throw error;
    invalidLoginResponse = error.response;
  }
  if (invalidLoginResponse.data.success) {
    throw new Error('Invalid credentials were accepted');
  }
  console.log('Invalid credentials were rejected.');

  const suffix = Date.now();
  const registerResponse = await axios.post(`${baseURL}/auth/register`, {
    username: `testuser_${suffix}`,
    email: `test_${suffix}@example.com`,
    password: crypto.randomBytes(24).toString('hex'),
    full_name: '测试用户',
    phone: '13800138001',
  });
  if (!registerResponse.data.success) {
    throw new Error(`Registration failed: ${registerResponse.data.message}`);
  }
  console.log('Registration succeeded.');
}

async function checkBackendStatus() {
  try {
    await axios.get('http://localhost:8080/');
    return true;
  } catch {
    console.error('Backend is not running. Start it with: cd apps/backend && yarn dev');
    return false;
  }
}

async function main() {
  if (await checkBackendStatus()) await testLogin();
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
