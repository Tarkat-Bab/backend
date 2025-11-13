import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { DashboardUsersService } from './users.service';
import { FilterTechnicianReqDto, FilterUsersDto } from 'src/modules/users/dtos/filter-user-dto';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { AdminPermissions } from 'src/common/permissions/admin.permissions';
import { UserStatus } from 'src/common/enums/users.enum';
import { sendMessageDto } from 'src/modules/notifications/dtos/send-notification.dto';
import { ParseBoolPipe } from '@nestjs/common';

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller('dashboard/users')
@ApiHeader({
    name: 'Accept-Language',
    description: 'Language for the response (e.g., ar, en)',
    required: false,
})  
export class DashboardUsersController {
    constructor(
        private readonly usersService: DashboardUsersService,
    ) {}
    
   
    @Permissions(AdminPermissions.VIEW_USERS) 
    @Get()
    getUsers(
        @Query() filterUserDto: FilterUsersDto,
        @Language() lang: LanguagesEnum,
    ) {
        return this.usersService.getAllUsers(filterUserDto, lang);
    }

    @Permissions(AdminPermissions.VIEW_USERS) 
    @Get('technicians/requests')
    getTechniciansReq(
        @Query() filterUserDto: FilterTechnicianReqDto,
    ) {
        return this.usersService.listTechniciansReq(filterUserDto);
    }

    @Patch('technicians/approved/:id')
    @Permissions(AdminPermissions.UPDATE_USER)
    approveTech(
      @Param('id') userId: number,
      @Query('approved', ParseBoolPipe) approved: boolean,
      @Language() lang: LanguagesEnum,
    ) {
      return this.usersService.approveTech(userId, approved, lang);
    }

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
        @Body() body: sendMessageDto,
    ) {
        return this.usersService.changeUserStatus(userId, UserStatus.BLOCKED, body);
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
        @Body() body: sendMessageDto,
        @Language() lang: LanguagesEnum,

    ){
        return this.usersService.warnUser(userId, body, lang);
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