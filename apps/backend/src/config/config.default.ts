// import { MidwayConfig } from '@midwayjs/core';

export default {
  // use for cookie sign key, should change to your own and keep security
  keys: '1749113746417_2941',
  koa: {
    port: parseInt(process.env.BACKEND_PORT || '8080'),
    cors: {
      origin: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
        : '*',
      credentials: true,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    },
  },
  // TypeORM 数据库配置
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
        logging: process.env.NODE_ENV === 'local',
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
    secret:
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  // Redis 配置（如果需要的话）
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
    description:
      '客户合同管理系统的RESTful API文档，支持客户、合同、发票、支付等业务功能',
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
    // 标签配置
    tags: [
      {
        name: '用户认证',
        description: '用户登录、注册等认证相关接口',
      },
      {
        name: '客户管理',
        description: '客户信息的增删改查操作',
      },
      {
        name: '合同管理',
        description: '合同信息的管理和维护',
      },
      {
        name: '发票管理',
        description: '发票开具和管理功能',
      },
      {
        name: '支付管理',
        description: '支付记录的管理和跟踪',
      },
      {
        name: '附件管理',
        description: '文件上传和附件管理',
      },
    ],
    // UI 显示配置
    displayOptions: {
      deepLinking: true,
      displayOperationId: false,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      defaultModelRendering: 'model',
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
    // 文档选项
    documentOptions: {
      operationIdFactory: (controllerKey: string, webRouter: any) => {
        const url = webRouter?.url || webRouter?.path || 'unknown';
        const method = webRouter?.method || 'unknown';
        return `${controllerKey}_${method}_${url.replace(/[/:]/g, '_')}`;
      },
    },
  },

  // 文件上传配置
  upload: {
    // 模式，默认为 file，即上传到服务器临时目录
    mode: 'file',
    // 上传的文件大小限制，默认为 10mb
    fileSize: '10mb',
    // 上传的文件白名单，只有这些类型的文件才能上传
    whitelist: ['.pdf', '.jpg', '.jpeg', '.png'],
    // 临时文件目录
    tmpdir: '/tmp',
    // 清理临时文件
    cleanTimeout: 5 * 60 * 1000,
    // 上传文件存储目录（支持环境变量配置）
    uploadDir: process.env.UPLOAD_DIR || '/app/uploads',
  },

  // 日志配置
  midwayLogger: {
    default: {
      level: process.env.LOG_LEVEL || 'info',
      consoleLevel: process.env.CONSOLE_LOG_LEVEL || 'info',
      dir: process.env.LOG_DIR || '/app/logs',
      fileLogName: 'app.log',
      errorLogName: 'error.log',
      format: (info: any) => {
        return `${info.timestamp} [${info.level}] ${info.message}`;
      },
      // 日志轮转配置
      maxFiles: '30d',
      maxSize: '100m',
      auditFile: 'audit.json',
    },
    categories: {
      coreLogger: {
        level: process.env.LOG_LEVEL || 'info',
        consoleLevel: process.env.CONSOLE_LOG_LEVEL || 'info',
        dir: process.env.LOG_DIR || '/app/logs',
        fileLogName: 'core.log',
        errorLogName: 'core-error.log',
        maxFiles: '30d',
        maxSize: '100m',
      },
      appLogger: {
        level: process.env.LOG_LEVEL || 'info',
        consoleLevel: process.env.CONSOLE_LOG_LEVEL || 'info',
        dir: process.env.LOG_DIR || '/app/logs',
        fileLogName: 'app.log',
        errorLogName: 'app-error.log',
        maxFiles: '30d',
        maxSize: '100m',
      },
    },
  },
};
