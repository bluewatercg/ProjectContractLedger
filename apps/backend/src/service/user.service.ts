import { Provide, Config } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import * as bcrypt from 'bcryptjs';

@Provide()
export class UserService {
  @InjectEntityModel(User)
  userModel: Repository<User>;

  @Config('jwt')
  jwtConfig;

  async getUser(options: { uid: number; username?: string }) {
    return this.userModel.findOne({
      where: {
        id: options.uid,
      },
    });
  }

  async findAll(query: any = {}) {
    const { page = 1, pageSize = 10, ...params } = query;
    const skip = (page - 1) * pageSize;

    // Build query builder for flexible filtering
    const qb = this.userModel.createQueryBuilder('user');

    if (params.username) {
      qb.andWhere('user.username LIKE :username', { username: `%${params.username}%` });
    }

    if (params.email) {
      qb.andWhere('user.email LIKE :email', { email: `%${params.email}%` });
    }

    if (params.role) {
      qb.andWhere('user.role = :role', { role: params.role });
    }

    if (params.status) {
      qb.andWhere('user.status = :status', { status: params.status });
    }

    qb.orderBy('user.created_at', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    // Remove passwords from result
    const safeList = list.map(u => {
      const { password, ...rest } = u;
      return rest;
    });

    return { list: safeList, total };
  }

  async findOne(id: number) {
    const user = await this.userModel.findOne({ where: { id } });
    if (user) {
      const { password, ...rest } = user;
      return rest;
    }
    return null;
  }

  async create(userData: Partial<User>) {
    if (userData.password) {
      userData.password = bcrypt.hashSync(userData.password, 10);
    }
    const user = this.userModel.create(userData);
    await this.userModel.save(user);
    const { password, ...rest } = user;
    return rest;
  }

  async update(id: number, userData: Partial<User>) {
    if (userData.password) {
      userData.password = bcrypt.hashSync(userData.password, 10);
    }

    await this.userModel.update(id, userData);
    const user = await this.userModel.findOne({ where: { id } });
    const { password, ...rest } = user;
    return rest;
  }

  async delete(id: number) {
    return this.userModel.delete(id);
  }
}
