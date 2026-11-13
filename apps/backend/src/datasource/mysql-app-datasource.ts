import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * 固定会话时区的 MySQL DataSource
 *
 * 背景：
 * - 服务器全局 time_zone 属于共享配置，本应用无权也不应修改；
 * - 表的 created_at / updated_at 等列使用 `CURRENT_TIMESTAMP` 默认值，
 *   这类值由 MySQL 按**会话时区**生成，不固定就会随服务器 OS 时区漂移；
 * - 提醒功能里的 CURDATE() 同样走会话时区。
 *
 * 因此这里为连接池中的**每一条**连接执行 `SET SESSION time_zone`，
 * 把写入与读取的口径都锁死在应用期望的 +08:00。
 *
 * 实现要点：
 * - TypeORM 建池时会先借一条连接做健康检查，那条连接早于 `connection` 事件，
 *   所以除了挂事件钩子，还要回头把池内已有连接一并设置；
 * - mysql2 的 `timezone` 选项只影响 JS Date 的解析，不改变会话时区。
 *   这里显式置为 'Z'，避免 mysql2 把 '+08:00' 偏移再叠加一次。
 */
export class MySqlAppDataSource extends DataSource {
  private sessionTimeZone: string;

  constructor(options: DataSourceOptions) {
    super(options);
    this.sessionTimeZone = (options as any).sessionTimeZone ?? '+08:00';
  }

  async initialize(): Promise<this> {
    const result = await super.initialize();
    await this.applySessionTimeZone();
    return result as this;
  }

  private get sessionTimeZoneSql(): string {
    // 值来自配置常量而非用户输入；仍按白名单格式校验，避免拼接出意外的 SQL
    if (!/^[+-]\d{2}:\d{2}$/.test(this.sessionTimeZone)) {
      throw new Error(
        `Invalid sessionTimeZone: ${this.sessionTimeZone}, expected '+HH:MM'`
      );
    }
    return `SET SESSION time_zone = '${this.sessionTimeZone}'`;
  }

  private async applySessionTimeZone(): Promise<void> {
    const pool: any = (this.driver as any).pool;
    if (!pool) {
      return;
    }

    // 1) 后续新建的连接
    pool.on?.('connection', (connection: any) => {
      connection.query(this.sessionTimeZoneSql, () => {
        /* 单条连接初始化失败不阻断建连，由下面的校验兜底 */
      });
    });

    // 2) 池内已存在的连接（含 TypeORM 健康检查借出的那条）
    const existing: any = pool._allConnections;
    const connections: any[] =
      typeof existing?.toArray === 'function' ? existing.toArray() : [];
    for (const connection of connections) {
      await new Promise<void>(resolve => {
        connection.query(this.sessionTimeZoneSql, () => resolve());
      });
    }

    // 3) 复核：确认当前连接确实生效，避免静默失败
    const [row] = await this.query('SELECT @@session.time_zone AS tz');
    if (row?.tz !== this.sessionTimeZone) {
      throw new Error(
        `Failed to pin session time_zone: expected ${this.sessionTimeZone}, got ${row?.tz}`
      );
    }
  }
}
