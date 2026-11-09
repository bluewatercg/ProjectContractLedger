import { Provide, Init } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entity/user.entity';

@Provide()
export class InitService {
  @InjectEntityModel(User)
  userRepository: Repository<User>;

  @Init()
  async init() {
    await this.createDefaultAdmin();
  }

  async createDefaultAdmin() {
    try {
      const existingAdmin = await this.userRepository.findOne({
        where: { username: 'admin' },
      });

      if (existingAdmin) {
        console.log('默认管理员账户已存在');
        return;
      }

      const password = process.env.INITIAL_ADMIN_PASSWORD;
      if (!password || password.length < 12) {
        console.warn(
          '未设置至少12位的 INITIAL_ADMIN_PASSWORD，跳过默认管理员创建'
        );
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const adminUser = this.userRepository.create({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        full_name: '系统管理员',
        phone: '13800138000',
        role: 'admin',
        status: 'active',
      });

      await this.userRepository.save(adminUser);
      console.log('默认管理员账户创建成功');
    } catch (error) {
      console.error('创建默认管理员账户失败:', error);
    }
  }
}
