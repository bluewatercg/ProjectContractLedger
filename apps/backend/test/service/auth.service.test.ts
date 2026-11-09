import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '../../src/service/auth.service';

describe('AuthService JWT secret', () => {
  it('uses configured secret to sign and verify tokens', async () => {
    const service = new AuthService() as any;
    const secret = 'configured-test-jwt-secret';
    const user = {
      id: 3,
      username: 'admin',
      password: await bcrypt.hash('test-password', 4),
      status: 'active',
      role: 'admin',
      email: 'admin@example.test',
      full_name: 'Admin',
      phone: '',
    };
    service.jwtSecret = secret;
    service.userRepository = {
      findOne: jest.fn().mockResolvedValue(user),
    };
    service.kitService = {
      getKitsByUserId: jest.fn().mockResolvedValue([]),
      getUserDefaultKit: jest.fn().mockResolvedValue(null),
    };

    const result = await service.login({
      username: user.username,
      password: 'test-password',
    });

    expect(jwt.verify(result.token, secret)).toMatchObject({
      id: user.id,
      username: user.username,
    });
    await expect(service.verifyToken(result.token)).resolves.toMatchObject({
      id: user.id,
    });
    await expect(
      service.verifyToken(jwt.sign({ id: user.id }, 'different-test-secret'))
    ).rejects.toThrow('无效的token');
  });
});
