// import { MidwayConfig } from '@midwayjs/core';

export default {
  // 本地开发环境配置
  typeorm: {
    dataSource: {
      default: {
        type: 'mysql',
        host: 'mysql.sqlpub.com',
        port: 3306,
        username: 'millerchen',
        password: process.env.DB_PASSWORD || '',
        database: 'procontractledger',
        synchronize: false, // 暂时禁用，需要先运行迁移脚本
        logging: true,
        entities: ['**/entity/*.entity{.ts,.js}'],
        timezone: '+08:00',
      },
    },
  },
  jwt: {
    secret: 'local-development-secret-key',
    expiresIn: '24h',
  },
};
