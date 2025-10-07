import { Injectable } from '@nestjs/common';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { FilterUsersDto } from 'src/modules/users/dtos/filter-user-dto';
import { UsersService } from 'src/modules/users/services/users.service';

@Injectable()
export class DashboardUsersService {
    constructor(
        private readonly usersService: UsersService,
    ) {}

    async getAllUsers(filterUserDto: FilterUsersDto, lang: LanguagesEnum) {
        return this.usersService.list(filterUserDto, lang);
    }
}
