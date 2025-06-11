/**
 * 性能测试脚本
 * 用于测试仪表板API的性能改进
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080/api/v1';

// 测试配置
const TEST_CONFIG = {
  iterations: 10,
  concurrency: 5,
  endpoints: [
    '/statistics/dashboard',
    '/statistics/revenue/trend',
    '/statistics/customers/distribution',
    '/statistics/contracts/status',
    '/statistics/invoices/status',
    '/statistics/payments/methods'
  ]
};

/**
 * 执行单次API请求并测量时间
 */
async function measureApiCall(endpoint) {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      timeout: 30000
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      endpoint,
      success: true,
      duration,
      status: response.status,
      dataSize: JSON.stringify(response.data).length
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      endpoint,
      success: false,
      duration,
      error: error.message,
      status: error.response?.status || 0
    };
  }
}

/**
 * 并发测试
 */
async function concurrentTest(endpoint, concurrency = 5) {
  console.log(`\n🔄 并发测试 ${endpoint} (并发数: ${concurrency})`);
  
  const promises = Array(concurrency).fill().map(() => measureApiCall(endpoint));
  const results = await Promise.all(promises);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    const durations = successful.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    console.log(`✅ 成功: ${successful.length}/${results.length}`);
    console.log(`⏱️  平均响应时间: ${avgDuration.toFixed(2)}ms`);
    console.log(`⚡ 最快响应时间: ${minDuration}ms`);
    console.log(`🐌 最慢响应时间: ${maxDuration}ms`);
    
    if (successful[0].dataSize) {
      console.log(`📦 数据大小: ${(successful[0].dataSize / 1024).toFixed(2)}KB`);
    }
  }
  
  if (failed.length > 0) {
    console.log(`❌ 失败: ${failed.length}/${results.length}`);
    failed.forEach(f => {
      console.log(`   - ${f.error} (${f.duration}ms)`);
    });
  }
  
  return {
    endpoint,
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    avgDuration: successful.length > 0 ? successful.reduce((a, b) => a + b.duration, 0) / successful.length : 0,
    minDuration: successful.length > 0 ? Math.min(...successful.map(r => r.duration)) : 0,
    maxDuration: successful.length > 0 ? Math.max(...successful.map(r => r.duration)) : 0
  };
}

/**
 * 缓存测试
 */
async function cacheTest(endpoint) {
  console.log(`\n🗄️  缓存测试 ${endpoint}`);
  
  // 清除缓存
  try {
    await axios.post(`${API_BASE_URL}/statistics/cache/clear`);
    console.log('✅ 缓存已清除');
  } catch (error) {
    console.log('⚠️  缓存清除失败:', error.message);
  }
  
  // 第一次请求（冷缓存）
  console.log('🥶 冷缓存请求...');
  const coldResult = await measureApiCall(endpoint);
  
  if (coldResult.success) {
    console.log(`   响应时间: ${coldResult.duration}ms`);
  } else {
    console.log(`   失败: ${coldResult.error}`);
    return null;
  }
  
  // 等待一秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 第二次请求（热缓存）
  console.log('🔥 热缓存请求...');
  const hotResult = await measureApiCall(endpoint);
  
  if (hotResult.success) {
    console.log(`   响应时间: ${hotResult.duration}ms`);
    const improvement = ((coldResult.duration - hotResult.duration) / coldResult.duration * 100);
    console.log(`🚀 缓存改进: ${improvement.toFixed(1)}% (节省 ${coldResult.duration - hotResult.duration}ms)`);
  } else {
    console.log(`   失败: ${hotResult.error}`);
  }
  
  return {
    endpoint,
    coldDuration: coldResult.duration,
    hotDuration: hotResult.success ? hotResult.duration : null,
    improvement: hotResult.success ? ((coldResult.duration - hotResult.duration) / coldResult.duration * 100) : 0
  };
}

/**
 * 主测试函数
 */
async function runPerformanceTest() {
  console.log('🚀 开始性能测试...\n');
  console.log(`API 基础URL: ${API_BASE_URL}`);
  console.log(`测试配置: ${TEST_CONFIG.iterations} 次迭代, ${TEST_CONFIG.concurrency} 并发\n`);
  
  const results = {
    concurrent: [],
    cache: []
  };
  
  // 并发测试
  console.log('=' .repeat(50));
  console.log('📊 并发性能测试');
  console.log('=' .repeat(50));
  
  for (const endpoint of TEST_CONFIG.endpoints) {
    const result = await concurrentTest(endpoint, TEST_CONFIG.concurrency);
    results.concurrent.push(result);
    
    // 等待一秒避免过载
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 缓存测试
  console.log('\n' + '=' .repeat(50));
  console.log('🗄️  缓存性能测试');
  console.log('=' .repeat(50));
  
  // 只测试主要端点的缓存
  const cacheEndpoints = ['/statistics/dashboard'];
  
  for (const endpoint of cacheEndpoints) {
    const result = await cacheTest(endpoint);
    if (result) {
      results.cache.push(result);
    }
    
    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 输出总结
  console.log('\n' + '=' .repeat(50));
  console.log('📈 测试总结');
  console.log('=' .repeat(50));
  
  console.log('\n🔄 并发测试结果:');
  results.concurrent.forEach(r => {
    if (r.successful > 0) {
      console.log(`  ${r.endpoint}: ${r.avgDuration.toFixed(2)}ms 平均 (${r.successful}/${r.total} 成功)`);
    } else {
      console.log(`  ${r.endpoint}: 全部失败`);
    }
  });
  
  console.log('\n🗄️  缓存测试结果:');
  results.cache.forEach(r => {
    console.log(`  ${r.endpoint}: ${r.improvement.toFixed(1)}% 改进 (${r.coldDuration}ms → ${r.hotDuration}ms)`);
  });
  
  console.log('\n✅ 测试完成!');
}

// 运行测试
if (require.main === module) {
  runPerformanceTest().catch(error => {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  measureApiCall,
  concurrentTest,
  cacheTest,
  runPerformanceTest
};
