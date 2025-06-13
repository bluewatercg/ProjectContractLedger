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
        password: 'c3TyBrus2OmLeeIu',
        database: 'procontractledger',
        synchronize: true,
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
