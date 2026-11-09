describe('local database configuration', () => {
  const originalPassword = process.env.DB_PASSWORD;

  afterEach(() => {
    if (originalPassword === undefined) {
      delete process.env.DB_PASSWORD;
    } else {
      process.env.DB_PASSWORD = originalPassword;
    }
    jest.resetModules();
  });

  it('reads database password from DB_PASSWORD', () => {
    process.env.DB_PASSWORD = ['local', 'test', 'password'].join('-');
    let config: any;
    jest.isolateModules(() => {
      config = require('../../src/config/config.local').default;
    });

    expect(config.typeorm.dataSource.default.password).toBe(
      process.env.DB_PASSWORD
    );
  });
});
