import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { AdminPermissions } from 'src/common/permissions/admin.permissions';
import { DashboardConversationsService } from './conversations.service';

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller('dashboard/conversations')
@ApiHeader({
  name: 'Accept-Language',
  description: 'Language for the response (e.g., ar, en)',
  required: false,
})
export class DashboardConversationsController {
  constructor(
    private readonly conversationsService: DashboardConversationsService,
  ) {}

  @Permissions(AdminPermissions.VIEW_USERS)
  @Get()
  getAllConversations() {
    return this.conversationsService.getAllConversations();
  }

  // @Permissions(AdminPermissions.VIEW_USERS)
  // @Get(':id')
  // getConversationById(@Param('id') id: number) {
  //   return this.conversationsService.getConversationById(id);
  // }

  @Permissions(AdminPermissions.VIEW_USERS)
  @Get(':id/messages')
  getConversationMessages(@Param('id') id: number) {
    return this.conversationsService.getConversationMessages(id);
  }
}
