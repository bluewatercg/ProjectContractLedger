import { MainConfiguration } from '../src/configuration';

describe('MainConfiguration JWT setup', () => {
  it('fails startup before middleware registration when JWT secret is missing', async () => {
    const configuration = new MainConfiguration() as any;
    configuration.jwtSecret = '';
    configuration.app = {
      useMiddleware: jest.fn(),
      useFilter: jest.fn(),
    };

    await expect(configuration.onReady()).rejects.toThrow(/JWT_SECRET/);
    expect(configuration.app.useMiddleware).not.toHaveBeenCalled();
  });

  it('rejects a JWT secret shorter than 32 characters', async () => {
    const configuration = new MainConfiguration() as any;
    configuration.jwtSecret = ['too', 'short'].join('-');
    configuration.app = {
      useMiddleware: jest.fn(),
      useFilter: jest.fn(),
    };

    await expect(configuration.onReady()).rejects.toThrow(/32 characters/);
  });
});
