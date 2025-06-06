import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User } from '../entity/user.entity';
import { LoginDto, RegisterDto, UserInfo } from '../interface';

@Provide()
export class AuthService {
  @InjectEntityModel(User)
  userRepository: Repository<User>;

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto): Promise<{ token: string; user: UserInfo }> {
    const { username, password } = loginDto;
    
    // 查找用户
    const user = await this.userRepository.findOne({
      where: { username }
    });

    if (!user) {
      throw new Error('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }

    // 检查用户状态
    if (user.status !== 'active') {
      throw new Error('用户账户已被禁用');
    }

    // 生成JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      jwtSecret,
      { expiresIn } as jwt.SignOptions
    );

    // 返回用户信息（不包含密码）
    const userInfo: UserInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      status: user.status
    };

    return { token, user: userInfo };
  }

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto): Promise<UserInfo> {
    const { username, email, password, full_name, phone } = registerDto;

    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }]
    });

    if (existingUser) {
      throw new Error('用户名或邮箱已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const newUser = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      full_name,
      phone,
      role: 'user',
      status: 'active'
    });

    const savedUser = await this.userRepository.save(newUser);

    // 返回用户信息（不包含密码）
    return {
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      full_name: savedUser.full_name,
      phone: savedUser.phone,
      role: savedUser.role,
      status: savedUser.status
    };
  }

  /**
   * 验证JWT token
   */
  async verifyToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      throw new Error('无效的token');
    }
  }

  /**
   * 根据ID获取用户信息
   */
  async getUserById(id: number): Promise<UserInfo | null> {
    const user = await this.userRepository.findOne({
      where: { id }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      status: user.status
    };
  }
}
