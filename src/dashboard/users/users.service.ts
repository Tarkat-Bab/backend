import { Injectable } from '@nestjs/common';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { UserStatus } from 'src/common/enums/users.enum';
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

    async getUserById(id: number, lang: LanguagesEnum) {
        return this.usersService.findById(id, lang);
    }

    async changeUserStatus(userId: number, status: UserStatus){
        return await this.usersService.changeUserStatus(userId, status);
    }

    async removeUser(userId: number, lang: LanguagesEnum){
        return await this.usersService.removeUser(userId, lang);
    }
}
