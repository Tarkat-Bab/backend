import { Body, Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DashboardUsersService } from './users.service';
import { FilterUsersDto } from 'src/modules/users/dtos/filter-user-dto';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { isPublic } from 'src/common/decorators/public.decorator';

@ApiBearerAuth()
@isPublic()
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
    @Get()
    getUsers(
        @Query() filterUserDto: FilterUsersDto,
        @Language() lang: LanguagesEnum,
    ) {
        return this.usersService.getAllUsers(filterUserDto, lang);
    }
}