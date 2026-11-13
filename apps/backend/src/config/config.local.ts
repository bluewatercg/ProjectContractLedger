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
        // 与 config.default.ts 保持一致：JS Date 按 UTC 解析，
        // 会话时区由 MySqlAppDataSource 锁定为 +08:00
        timezone: 'Z',
        sessionTimeZone: '+08:00',
      },
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: '24h',
  },
};
