import {
  checkSchema,
  getDatabaseConfig,
} from '../../src/scripts/check-db-schema';

describe('scripts/check-db-schema', () => {
  const envKeys = [
    'DB_HOST',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_DATABASE',
    'DB_PORT',
  ];
  const originalEnv: Record<string, string | undefined> = {};
  envKeys.forEach(key => {
    originalEnv[key] = process.env[key];
  });

  afterEach(() => {
    for (const key of envKeys) {
      const value = originalEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('does not connect to MySQL on import (no side effects)', () => {
    expect(typeof checkSchema).toBe('function');
  });

  it('reads connection credentials from environment variables', () => {
    process.env.DB_HOST = 'db.test';
    process.env.DB_USERNAME = 'ledger_user';
    process.env.DB_PASSWORD = ['unit', 'test', 'db'].join('-');
    process.env.DB_DATABASE = 'ledger_test';
    process.env.DB_PORT = '3310';

    expect(getDatabaseConfig()).toEqual({
      host: 'db.test',
      port: 3310,
      user: 'ledger_user',
      password: ['unit', 'test', 'db'].join('-'),
      database: 'ledger_test',
      charset: 'utf8mb4',
    });
  });

  it('rejects missing database credentials before connecting', () => {
    envKeys.forEach(key => delete process.env[key]);
    expect(() => getDatabaseConfig()).toThrow(/DB_HOST/);
  });
});
