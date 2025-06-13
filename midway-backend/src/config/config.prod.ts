// import { MidwayConfig } from '@midwayjs/core';

export default {
  // 生产环境配置
  koa: {
    port: parseInt(process.env.BACKEND_PORT || '8080'),
  },
  typeorm: {
    dataSource: {
      default: {
        type: 'mysql',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        synchronize: false,
        logging: process.env.LOG_LEVEL === 'debug',
        entities: ['**/entity/*.entity{.ts,.js}'],
        timezone: '+08:00',
        // 生产环境连接池配置
        extra: {
          connectionLimit: parseInt(process.env.DB_POOL_SIZE || '20'),
          acquireTimeout: 60000,
          timeout: 60000,
          reconnect: true,
        },
      },
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  // Redis 配置
  redis: {
    client: {
      port: parseInt(process.env.REDIS_PORT || '6379'),
      host: process.env.REDIS_HOST,
      password: process.env.REDIS_PASSWORD || '',
      db: parseInt(process.env.REDIS_DB || '0'),
      // 生产环境连接配置
      connectTimeout: 10000,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    },
  },
};
