import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
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

    
    @Patch(':id')
    @ApiHeader({
       name: 'Accept-Language',
       description: 'Language for the response (e.g., ar, en)',
       required: false,
       enum: LanguagesEnum
    })
    @ApiOperation({
        summary: 'When user open notification, this endpoint marked as read',
    })    
   async markAsRead(
        @CurrentUser() user : any,
        @Param('id') id:number,
        @Language() lang: LanguagesEnum
    ){
        return await this.notificationsService.markAsRead(id, user.id, lang);
    }
}
