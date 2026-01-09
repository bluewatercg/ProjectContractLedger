import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Kit } from '../entity/kit.entity';
import { UserKit } from '../entity/user-kit.entity';

@Provide()
export class KitService {
    @InjectEntityModel(Kit)
    kitRepository: Repository<Kit>;

    @InjectEntityModel(UserKit)
    userKitRepository: Repository<UserKit>;

    /**
     * 获取所有套装列表
     */
    async getAllKits(): Promise<Kit[]> {
        return this.kitRepository.find({
            where: { status: 'active' },
            order: { created_at: 'ASC' },
        });
    }

    /**
     * 根据ID获取套装
     */
    async getKitById(id: number): Promise<Kit | null> {
        return this.kitRepository.findOne({ where: { id } });
    }

    /**
     * 根据code获取套装
     */
    async getKitByCode(code: string): Promise<Kit | null> {
        return this.kitRepository.findOne({ where: { code } });
    }

    /**
     * 创建套装
     */
    async createKit(data: {
        name: string;
        code: string;
        description?: string;
    }): Promise<Kit> {
        const kit = this.kitRepository.create(data);
        return this.kitRepository.save(kit);
    }

    /**
     * 更新套装
     */
    async updateKit(
        id: number,
        data: { name?: string; description?: string; status?: string }
    ): Promise<Kit | null> {
        const kit = await this.kitRepository.findOne({ where: { id } });
        if (!kit) return null;

        Object.assign(kit, data);
        return this.kitRepository.save(kit);
    }

    /**
     * 删除套装
     */
    async deleteKit(id: number): Promise<boolean> {
        const result = await this.kitRepository.delete(id);
        return result.affected > 0;
    }

    /**
     * 获取用户授权的套装列表
     */
    async getKitsByUserId(userId: number): Promise<Kit[]> {
        const userKits = await this.userKitRepository.find({
            where: { user_id: userId },
            relations: ['kit'],
            order: { is_default: 'DESC', created_at: 'ASC' },
        });

        return userKits
            .filter(uk => uk.kit && uk.kit.status === 'active')
            .map(uk => ({
                ...uk.kit,
                is_default: uk.is_default,
            })) as Kit[];
    }

    /**
     * 获取用户的默认套装
     */
    async getUserDefaultKit(userId: number): Promise<Kit | null> {
        const userKit = await this.userKitRepository.findOne({
            where: { user_id: userId, is_default: true },
            relations: ['kit'],
        });

        if (userKit && userKit.kit) {
            return userKit.kit;
        }

        // 如果没有默认套装，返回用户的第一个授权套装
        const firstKit = await this.userKitRepository.findOne({
            where: { user_id: userId },
            relations: ['kit'],
            order: { created_at: 'ASC' },
        });

        return firstKit?.kit || null;
    }

    /**
     * 授权用户访问套装
     */
    async assignUserToKit(
        userId: number,
        kitId: number,
        isDefault = false
    ): Promise<UserKit> {
        // 如果设置为默认，先取消其他默认
        if (isDefault) {
            await this.userKitRepository.update(
                { user_id: userId },
                { is_default: false }
            );
        }

        // 检查是否已存在
        const existing = await this.userKitRepository.findOne({
            where: { user_id: userId, kit_id: kitId },
        });

        if (existing) {
            existing.is_default = isDefault;
            return this.userKitRepository.save(existing);
        }

        const userKit = this.userKitRepository.create({
            user_id: userId,
            kit_id: kitId,
            is_default: isDefault,
        });

        return this.userKitRepository.save(userKit);
    }

    /**
     * 移除用户的套装访问权限
     */
    async removeUserFromKit(userId: number, kitId: number): Promise<boolean> {
        const result = await this.userKitRepository.delete({
            user_id: userId,
            kit_id: kitId,
        });
        return result.affected > 0;
    }

    /**
     * 设置用户的默认套装
     */
    async setUserDefaultKit(userId: number, kitId: number): Promise<boolean> {
        // 先取消所有默认
        await this.userKitRepository.update(
            { user_id: userId },
            { is_default: false }
        );

        // 设置新的默认
        const result = await this.userKitRepository.update(
            { user_id: userId, kit_id: kitId },
            { is_default: true }
        );

        return result.affected > 0;
    }

    /**
     * 检查用户是否有权访问指定套装
     */
    async checkUserKitAccess(userId: number, kitId: number): Promise<boolean> {
        const userKit = await this.userKitRepository.findOne({
            where: { user_id: userId, kit_id: kitId },
        });
        return !!userKit;
    }
}
