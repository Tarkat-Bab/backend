import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DashboardUsersService } from './users.service';
import { FilterUsersDto } from 'src/modules/users/dtos/filter-user-dto';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { isPublic } from 'src/common/decorators/public.decorator';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { AdminPermissions } from 'src/common/permissions/admin.permissions';
import { UserStatus } from 'src/common/enums/users.enum';

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller('dashboard/users')
export class DashboardUsersController {
    constructor(
        private readonly usersService: DashboardUsersService,
    ) {}
    
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false,
    })     
    @Permissions(AdminPermissions.VIEW_USERS) 
    @Get()
    getUsers(
        @Query() filterUserDto: FilterUsersDto,
        @Language() lang: LanguagesEnum,
    ) {
        return this.usersService.getAllUsers(filterUserDto, lang);
    }

    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false,
    })   
    @Get(':id')
    @Permissions(AdminPermissions.VIEW_USERS) 
    getUserById(
        @Param('id') id: number,
        @Language() lang: LanguagesEnum,
    ) {
        return this.usersService.getUserById(id, lang);
    }

    @Patch('block/:id')
    @Permissions(AdminPermissions.UPDATE_USER) 
    changeUserStatus(
        @Param('id') userId: number,
    ) {
        return this.usersService.changeUserStatus(userId, UserStatus.BLOCKED);
    }

    @Patch('activate/:id')
    @Permissions(AdminPermissions.UPDATE_USER) 
    activateUser(
        @Param('id') userId: number,
    ) {
        return this.usersService.changeUserStatus(userId, UserStatus.ACTIVE);
    }

    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false,
    })   
    @Patch('warning/:id')
    @Permissions(AdminPermissions.UPDATE_USER) 
    async warnUser(
        @Param('id') userId: number,
        @Language() lang: LanguagesEnum,

    ){
        return this.usersService.warnUser(userId, lang);
    }

    @Delete(':id')
    @Permissions(AdminPermissions.DELETE_USER) 
    removeUser(
        @Param('id') userId: number,
        @Language() lang: LanguagesEnum,
    ) {
        return this.usersService.removeUser(userId, lang);
    }
}