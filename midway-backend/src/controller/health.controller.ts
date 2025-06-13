import { Controller, Get } from '@midwayjs/decorator';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('/health')
export class HealthController {
  @InjectDataSource()
  dataSource: DataSource;

  /**
   * 健康检查端点
   */
  @Get('/')
  async health() {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: 'unknown',
        memory: 'ok',
      },
    };

    // 检查数据库连接
    try {
      if (this.dataSource && this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        healthStatus.checks.database = 'ok';
      } else {
        healthStatus.checks.database = 'disconnected';
        healthStatus.status = 'degraded';
      }
    } catch (error) {
      healthStatus.checks.database = 'error';
      healthStatus.status = 'unhealthy';
    }

    // 检查内存使用情况
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    if (memoryUsageMB > 500) {
      // 如果内存使用超过500MB
      healthStatus.checks.memory = 'high';
      if (healthStatus.status === 'ok') {
        healthStatus.status = 'degraded';
      }
    }

    // 添加内存信息
    healthStatus['memory'] = {
      heapUsed: `${memoryUsageMB}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
    };

    return healthStatus;
  }

  /**
   * 简单的健康检查端点（仅返回状态）
   */
  @Get('/simple')
  async simpleHealth() {
    return { status: 'ok' };
  }

  /**
   * 就绪检查端点
   */
  @Get('/ready')
  async ready() {
    try {
      // 检查数据库连接
      if (this.dataSource && this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        return { status: 'ready' };
      } else {
        throw new Error('Database not ready');
      }
    } catch (error) {
      return {
        status: 'not ready',
        error: error.message,
      };
    }
  }

  /**
   * 存活检查端点
   */
  @Get('/live')
  async live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
