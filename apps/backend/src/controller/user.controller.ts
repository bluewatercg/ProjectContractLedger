import { Controller, Get, Post, Put, Del, Body, Param, Query, Inject } from '@midwayjs/decorator';
import { Validate } from '@midwayjs/validate';
import {
    ApiTags,
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@midwayjs/swagger';
import { UserService } from '../service/user.service';
import { CreateUserDto, UpdateUserDto, ApiResponse } from '../interface';

@ApiTags(['用户管理'])
@ApiBearerAuth()
@Controller('/api/v1/users')
export class UserController {
    @Inject()
    userService: UserService;

    @Get('/')
    @ApiOperation({ summary: '获取用户列表' })
    @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
    @ApiQuery({ name: 'pageSize', required: false, description: '每页数量', example: 10 })
    @ApiQuery({ name: 'username', required: false, description: '用户名搜索' })
    @ApiQuery({ name: 'email', required: false, description: '邮箱搜索' })
    @ApiQuery({ name: 'role', required: false, description: '角色筛选' })
    @ApiQuery({ name: 'status', required: false, description: '状态筛选' })
    @ApiOkResponse({ description: '用户列表' })
    async index(@Query() query: any): Promise<ApiResponse> {
        const result = await this.userService.findAll(query);
        return { success: true, data: result };
    }

    @Get('/:id')
    @ApiOperation({ summary: '获取用户详情' })
    @ApiParam({ name: 'id', description: '用户ID', required: true })
    @ApiOkResponse({ description: '用户详情' })
    async show(@Param('id') id: number): Promise<ApiResponse> {
        const user = await this.userService.findOne(id);
        if (!user) {
            return { success: false, code: 404, message: 'User not found' };
        }
        return { success: true, data: user };
    }

    @Post('/')
    @ApiOperation({ summary: '创建新用户' })
    @Validate()
    @ApiBody({ type: CreateUserDto })
    @ApiOkResponse({ description: '创建成功' })
    async create(@Body() userDto: CreateUserDto): Promise<ApiResponse> {
        try {
            const user = await this.userService.create(userDto);
            return { success: true, data: user, message: 'User created successfully' };
        } catch (error) {
            return { success: false, code: 400, message: error.message };
        }
    }

    @Put('/:id')
    @ApiOperation({ summary: '更新用户信息' })
    @ApiParam({ name: 'id', description: '用户ID', required: true })
    @Validate()
    @ApiBody({ type: UpdateUserDto })
    @ApiOkResponse({ description: '更新成功' })
    async update(@Param('id') id: number, @Body() userDto: UpdateUserDto): Promise<ApiResponse> {
        try {
            const user = await this.userService.update(id, userDto);
            return { success: true, data: user, message: 'User updated successfully' };
        } catch (error) {
            return { success: false, code: 400, message: error.message };
        }
    }

    @Del('/:id')
    @ApiOperation({ summary: '删除用户' })
    @ApiParam({ name: 'id', description: '用户ID', required: true })
    @ApiOkResponse({ description: '删除成功' })
    async destroy(@Param('id') id: number): Promise<ApiResponse> {
        try {
            await this.userService.delete(id);
            return { success: true, message: 'User deleted successfully' };
        } catch (error) {
            return { success: false, code: 400, message: error.message };
        }
    }
}
