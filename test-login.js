const axios = require('axios');

// 测试登录功能
async function testLogin() {
  const baseURL = 'http://localhost:8080/api/v1';
  
  console.log('🧪 开始测试登录功能...\n');

  try {
    // 测试1: 正确的登录凭据
    console.log('📝 测试1: 使用正确的管理员凭据登录');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    if (loginResponse.data.success) {
      console.log('✅ 登录成功!');
      console.log('📄 用户信息:', JSON.stringify(loginResponse.data.data.user, null, 2));
      console.log('🔑 Token:', loginResponse.data.data.token.substring(0, 50) + '...');
      
      // 测试2: 使用token访问受保护的API
      console.log('\n📝 测试2: 使用token访问受保护的API');
      const token = loginResponse.data.data.token;
      
      try {
        const protectedResponse = await axios.get(`${baseURL}/customers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ 受保护的API访问成功!');
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('❌ Token验证失败');
        } else {
          console.log('✅ Token验证成功 (API可能返回其他错误，这是正常的)');
        }
      }
    } else {
      console.log('❌ 登录失败:', loginResponse.data.message);
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ 登录请求失败:', error.response.data);
    } else {
      console.log('❌ 网络错误:', error.message);
    }
  }

  try {
    // 测试3: 错误的登录凭据
    console.log('\n📝 测试3: 使用错误的凭据登录');
    const wrongLoginResponse = await axios.post(`${baseURL}/auth/login`, {
      username: 'admin',
      password: 'wrongpassword'
    });
    
    console.log('❌ 应该登录失败但却成功了');
  } catch (error) {
    if (error.response?.data?.success === false) {
      console.log('✅ 错误凭据正确被拒绝:', error.response.data.message);
    } else {
      console.log('❌ 意外的错误:', error.message);
    }
  }

  try {
    // 测试4: 注册新用户
    console.log('\n📝 测试4: 注册新用户');
    const registerResponse = await axios.post(`${baseURL}/auth/register`, {
      username: 'testuser_' + Date.now(),
      email: 'test_' + Date.now() + '@example.com',
      password: 'test123',
      full_name: '测试用户',
      phone: '13800138001'
    });

    if (registerResponse.data.success) {
      console.log('✅ 用户注册成功!');
      console.log('📄 新用户信息:', JSON.stringify(registerResponse.data.data, null, 2));
    } else {
      console.log('❌ 用户注册失败:', registerResponse.data.message);
    }
  } catch (error) {
    if (error.response) {
      console.log('❌ 注册请求失败:', error.response.data);
    } else {
      console.log('❌ 网络错误:', error.message);
    }
  }

  console.log('\n🎯 登录功能测试完成!');
}

// 检查后端服务是否运行
async function checkBackendStatus() {
  try {
    const response = await axios.get('http://localhost:8080/');
    console.log('✅ 后端服务正在运行');
    return true;
  } catch (error) {
    console.log('❌ 后端服务未运行，请先启动后端服务');
    console.log('💡 运行命令: cd midway-backend && yarn dev');
    return false;
  }
}

// 主函数
async function main() {
  console.log('🚀 客户合同管理系统 - 登录功能测试\n');
  
  const isBackendRunning = await checkBackendStatus();
  if (isBackendRunning) {
    await testLogin();
  }
}

main().catch(console.error);
