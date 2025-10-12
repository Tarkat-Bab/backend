import { Body, Controller, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { DashboardRequestsService } from './requests.service';
import { FilterRequestDto } from 'src/modules/requests/dto/filter-request.dto';
import { AdminPermissions } from 'src/common/permissions/admin.permissions';

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller('dashboard/requests')
export class DashboardRequestsController {
    constructor(private readonly requestsService: DashboardRequestsService) {}

    @ApiHeader({
        name:'accept-language',
        description:'Language',
        required:false
    })
    // @Permissions(AdminPermissions.VIEW_REQUESTS)
    async getRequests(
        @Query() filter: FilterRequestDto
    ) {
        return this.requestsService.findAll(filter);
    }
}
