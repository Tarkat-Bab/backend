import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { sendNotificationDto } from './dtos/send-notification.dto';
import { NotificationsService } from './notifications.service';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { PaginatorInput } from 'src/common/paginator/types/paginate.input';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

@ApiBearerAuth()
@ApiTags('Notifications')
@Controller('Notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    @ApiHeader({
       name: 'Accept-Language',
       description: 'Language for the response (e.g., ar, en)',
       required: false,
       enum: LanguagesEnum
    })
    async getUserNotifications(
        @CurrentUser() user: any,
        @Query() filter: PaginatorInput,
        @Language() lang: LanguagesEnum
    ) {
        return this.notificationsService.getUserNotifications(user.id, filter, lang);
    }
}
