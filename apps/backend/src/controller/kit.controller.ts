import {
    Controller,
    Get,
    Post,
    Put,
    Del,
    Body,
    Param,
    Inject,
} from '@midwayjs/decorator';
import { ApiTags, ApiOperation } from '@midwayjs/swagger';
import { KitService } from '../service/kit.service';
import { ApiResponse } from '../interface';

@ApiTags('kits')
@Controller('/api/v1/kits')
export class KitController {
    @Inject()
    kitService: KitService;

    @ApiOperation({ summary: '获取所有套装列表' })
    @Get('/')
    async getAllKits(): Promise<ApiResponse> {
        try {
            const kits = await this.kitService.getAllKits();
            return {
                success: true,
                data: kits,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || '获取套装列表失败',
            };
        }
    }

    @ApiOperation({ summary: '根据ID获取套装' })
    @Get('/:id')
    async getKitById(@Param('id') id: number): Promise<ApiResponse> {
        try {
            const kit = await this.kitService.getKitById(id);
            if (!kit) {
                return {
                    success: false,
                    message: '套装不存在',
                };
            }
            return {
                success: true,
                data: kit,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || '获取套装失败',
            };
        }
    }

    @ApiOperation({ summary: '创建套装' })
    @Post('/')
    async createKit(
        @Body() body: { name: string; code: string; description?: string }
    ): Promise<ApiResponse> {
        try {
            // 检查code是否已存在
            const existing = await this.kitService.getKitByCode(body.code);
            if (existing) {
                return {
                    success: false,
                    message: '套装编码已存在',
                };
            }

            const kit = await this.kitService.createKit(body);
            return {
                success: true,
                data: kit,
                message: '套装创建成功',
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || '创建套装失败',
            };
        }
    }

    @ApiOperation({ summary: '更新套装' })
    @Put('/:id')
    async updateKit(
        @Param('id') id: number,
        @Body() body: { name?: string; description?: string; status?: string }
    ): Promise<ApiResponse> {
        try {
            const kit = await this.kitService.updateKit(id, body);
            if (!kit) {
                return {
                    success: false,
                    message: '套装不存在',
                };
            }
            return {
                success: true,
                data: kit,
                message: '套装更新成功',
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || '更新套装失败',
            };
        }
    }

    @ApiOperation({ summary: '删除套装' })
    @Del('/:id')
    async deleteKit(@Param('id') id: number): Promise<ApiResponse> {
        try {
            const success = await this.kitService.deleteKit(id);
            if (!success) {
                return {
                    success: false,
                    message: '套装不存在或删除失败',
                };
            }
            return {
                success: true,
                message: '套装删除成功',
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || '删除套装失败',
            };
        }
    }

    @ApiOperation({ summary: '获取用户授权的套装列表' })
    @Get('/user/:userId')
    async getUserKits(@Param('userId') userId: number): Promise<ApiResponse> {
        try {
            const kits = await this.kitService.getKitsByUserId(userId);
            return {
                success: true,
                data: kits,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || '获取用户套装失败',
            };
        }
    }

    @ApiOperation({ summary: '授权用户访问套装' })
    @Post('/user/:userId/assign')
    async assignUserToKit(
        @Param('userId') userId: number,
        @Body() body: { kitId: number; isDefault?: boolean }
    ): Promise<ApiResponse> {
        try {
            const userKit = await this.kitService.assignUserToKit(
                userId,
                body.kitId,
                body.isDefault || false
            );
            return {
                success: true,
                data: userKit,
                message: '授权成功',
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || '授权失败',
            };
        }
    }

    @ApiOperation({ summary: '移除用户的套装访问权限' })
    @Del('/user/:userId/kit/:kitId')
    async removeUserFromKit(
        @Param('userId') userId: number,
        @Param('kitId') kitId: number
    ): Promise<ApiResponse> {
        try {
            const success = await this.kitService.removeUserFromKit(userId, kitId);
            if (!success) {
                return {
                    success: false,
                    message: '移除失败',
                };
            }
            return {
                success: true,
                message: '移除成功',
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || '移除失败',
            };
        }
    }

    @ApiOperation({ summary: '设置用户的默认套装' })
    @Put('/user/:userId/default/:kitId')
    async setUserDefaultKit(
        @Param('userId') userId: number,
        @Param('kitId') kitId: number
    ): Promise<ApiResponse> {
        try {
            const success = await this.kitService.setUserDefaultKit(userId, kitId);
            if (!success) {
                return {
                    success: false,
                    message: '设置默认套装失败',
                };
            }
            return {
                success: true,
                message: '设置成功',
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || '设置失败',
            };
        }
    }
}
