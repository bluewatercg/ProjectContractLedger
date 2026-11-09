import * as bcrypt from 'bcryptjs';
import { InitService } from '../../src/service/init.service';

describe('InitService default admin bootstrap', () => {
  const originalPassword = process.env.INITIAL_ADMIN_PASSWORD;

  afterEach(() => {
    if (originalPassword === undefined) {
      delete process.env.INITIAL_ADMIN_PASSWORD;
    } else {
      process.env.INITIAL_ADMIN_PASSWORD = originalPassword;
    }
    jest.restoreAllMocks();
  });

  it('does not create a known default admin without configured password', async () => {
    delete process.env.INITIAL_ADMIN_PASSWORD;
    const userRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      save: jest.fn(),
    };
    const service = new InitService();
    service.userRepository = userRepository as any;
    jest.spyOn(console, 'warn').mockImplementation();

    await service.createDefaultAdmin();

    expect(userRepository.create).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a bootstrap password shorter than 12 characters', async () => {
    process.env.INITIAL_ADMIN_PASSWORD = 'short';
    const userRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      save: jest.fn(),
    };
    const service = new InitService();
    service.userRepository = userRepository as any;
    jest.spyOn(console, 'warn').mockImplementation();

    await service.createDefaultAdmin();

    expect(userRepository.create).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('hashes configured bootstrap password and never logs it', async () => {
    const password = ['test', 'bootstrap'].join('-');
    process.env.INITIAL_ADMIN_PASSWORD = password;
    const userRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn(user => user),
      save: jest.fn(user => user),
    };
    const service = new InitService();
    service.userRepository = userRepository as any;
    const log = jest.spyOn(console, 'log').mockImplementation();

    await service.createDefaultAdmin();

    const savedUser = userRepository.save.mock.calls[0][0];
    expect(await bcrypt.compare(password, savedUser.password)).toBe(true);
    expect(log.mock.calls.map(args => args.join(' ')).join(' ')).not.toContain(password);
  });
});
