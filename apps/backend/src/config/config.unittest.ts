// import { MidwayConfig } from '@midwayjs/core';

export default {
  // 测试环境端口设置为null（由测试框架管理）
  koa: {
    port: null,
    cors: {
      origin: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
        : '*',
      credentials: true,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    },
  },

  // TypeORM 数据库配置（与开发环境相同结构）
  typeorm: {
    dataSource: {
      default: {
        type: 'sqlite',
        database: ':memory:', // 使用内存数据库
        synchronize: true, // 单元测试时自动同步实体
        logging: false,
        entities: ['**/entity/*.entity{.ts,.js}'],
      },
    },
  },

  // JWT 配置
  jwt: {
    secret:
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Redis 配置
  redis: {
    client: {
      port: parseInt(process.env.REDIS_PORT || '6379'),
      host: process.env.REDIS_HOST || 'localhost',
      password: process.env.REDIS_PASSWORD || '',
      db: parseInt(process.env.REDIS_DB || '0'),
    },
  },

  // Swagger 配置
  swagger: {
    title: '客户合同管理系统API',
    description: '客户合同管理系统的RESTful API文档',
    version: '1.0.0',
    termsOfService: '',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
};
