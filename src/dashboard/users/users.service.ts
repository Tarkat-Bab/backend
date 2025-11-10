import { Injectable } from '@nestjs/common';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { UserStatus } from 'src/common/enums/users.enum';
import { sendMessageDto, sendNotificationDto } from 'src/modules/notifications/dtos/send-notification.dto';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { FilterUsersDto } from 'src/modules/users/dtos/filter-user-dto';
import { UsersService } from 'src/modules/users/services/users.service';

@Injectable()
export class DashboardUsersService {
    constructor(
        private readonly usersService: UsersService,
        private readonly notificationsService: NotificationsService,
    ) {}

    async getAllUsers(filterUserDto: FilterUsersDto, lang: LanguagesEnum) {
        return this.usersService.list(filterUserDto, lang);
    }

    async getUserById(id: number, lang: LanguagesEnum) {
        return this.usersService.findById(id, lang);
    }

    async changeUserStatus(userId: number, status: UserStatus, body?: sendMessageDto){
        if(body){
            await this.notificationsService.autoNotification(userId, "BLOCKED_USER", body)
        }
        return await this.usersService.changeUserStatus(userId, status);
    }

    async removeUser(userId: number, lang: LanguagesEnum){
        return await this.usersService.removeUser(userId, lang);
    }

    async warnUser(id:number, body: sendNotificationDto, lang: LanguagesEnum){
        const warning = await this.usersService.warnUser(id, lang);
        if(warning.userStatus === UserStatus.BLOCKED){
            return;
        }
        
        if(warning.blocked){
            await this.notificationsService.autoNotification(id, "BLOCKED_USER")
        }
        await this.notificationsService.autoNotification(id, "WARNING_USER", body )
    }
}
