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
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'contract_ledger',
        synchronize: false,
        migrationsRun: false,
        logging: process.env.NODE_ENV === 'local', // 根据环境变量决定是否记录日志
        entities: ['**/entity/*.entity{.ts,.js}'],
        timezone: '+08:00',
        // 连接池配置
        extra: {
          connectionLimit: parseInt(process.env.DB_POOL_SIZE || '10'),
          queueLimit: 0,
          reconnect: true,
          connectTimeout: 60000,
        },
      },
    },
  },

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
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
