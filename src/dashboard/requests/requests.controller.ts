import { Body, Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { DashboardRequestsService } from './requests.service';
import { FilterRequestDto } from 'src/modules/requests/dto/filter-request.dto';
import { AdminPermissions } from 'src/common/permissions/admin.permissions';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

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
    @Get()
    // @Permissions(AdminPermissions.VIEW_REQUESTS)
    async getRequests(
        @Query() filter: FilterRequestDto,
        @Language() lang: LanguagesEnum,
    ) {
        return this.requestsService.findAll(filter, lang);
    }
}
