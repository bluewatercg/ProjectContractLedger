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

  /**
   * 创建默认管理员账户
   */
  async createDefaultAdmin() {
    try {
      // 检查是否已存在管理员账户
      const existingAdmin = await this.userRepository.findOne({
        where: { username: 'admin' }
      });

      if (existingAdmin) {
        console.log('默认管理员账户已存在');
        return;
      }

      // 创建默认管理员账户
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = this.userRepository.create({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        full_name: '系统管理员',
        phone: '13800138000',
        role: 'admin',
        status: 'active'
      });

      await this.userRepository.save(adminUser);
      console.log('默认管理员账户创建成功: admin / admin123');
    } catch (error) {
      console.error('创建默认管理员账户失败:', error);
    }
  }

  /**
   * 创建测试用户账户
   */
  async createTestUsers() {
    try {
      const testUsers = [
        {
          username: 'user1',
          email: 'user1@example.com',
          password: 'user123',
          full_name: '测试用户1',
          role: 'user'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password: 'user123',
          full_name: '测试用户2',
          role: 'user'
        }
      ];

      for (const userData of testUsers) {
        const existingUser = await this.userRepository.findOne({
          where: { username: userData.username }
        });

        if (!existingUser) {
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          
          const user = this.userRepository.create({
            ...userData,
            password: hashedPassword,
            status: 'active'
          });

          await this.userRepository.save(user);
          console.log(`测试用户创建成功: ${userData.username} / ${userData.password}`);
        }
      }
    } catch (error) {
      console.error('创建测试用户失败:', error);
    }
  }
}
