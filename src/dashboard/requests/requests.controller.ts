import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { DashboardRequestsService } from './requests.service';
import { FilterRequestDto } from 'src/modules/requests/dto/filter-request.dto';
import { AdminPermissions } from 'src/common/permissions/admin.permissions';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { PaginatorInput } from 'src/common/paginator/types/paginate.input';

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
    @Permissions(AdminPermissions.VIEW_REQUESTS)
    async getRequests(
        @Query() filter: FilterRequestDto,
        @Language() lang: LanguagesEnum,
    ) {
        return this.requestsService.findAll(filter, lang);
    }

    @ApiHeader({
        name:'accept-language',
        description:'Language',
        required:false
    })
    @Get(':id')
    @Permissions(AdminPermissions.VIEW_REQUESTS)
    async getOneRequest(
        @Param('id') id: number,
        @Language() lang: LanguagesEnum,
    ) {
        return this.requestsService.findOne(id, lang);
    }


    @ApiHeader({
        name:'accept-language',
        description:'Language',
        required:false
    })
    @Get('/user/:id')
    @Permissions(AdminPermissions.VIEW_REQUESTS)
    async findServiceRequestsByUserId(
        @Param('id') id: number,
        @Query() filterUser: PaginatorInput,
        @Language() lang: LanguagesEnum,
    ) {
        return this.requestsService.findServiceRequestsByUserId(id, filterUser, lang);
    }


        @ApiHeader({
        name:'accept-language',
        description:'Language',
        required:false
    })

    @Get('/technician/:id')
    @Permissions(AdminPermissions.VIEW_REQUESTS)
    async findServiceRequestsByTechnicianId(
        @Query() filterTechnician: PaginatorInput,
        @Param('id') id: number,
        @Language() lang: LanguagesEnum,
    ) {
        return this.requestsService.findServiceRequestsByTechnicianId(id, filterTechnician, lang);
    }


    @Delete('/offer/:id')
    @Permissions(AdminPermissions.REMOVE_REQUESTS)
    @ApiHeader({
        name:'accept-language',
        description:'Language',
        required:false
    })  
    async removeOffer(
        @Param('id') id: number,
        @Language() lang: LanguagesEnum,
    ) {
        return this.requestsService.removeOffer(id, lang);
    }

    @Delete('/:id')
    @Permissions(AdminPermissions.REMOVE_REQUESTS)
    @ApiHeader({
        name:'accept-language',
        description:'Language',
        required:false
    })  
    async removeRequest(
        @Param('id') id: number,
        @Language() lang: LanguagesEnum,
    ) {
        return this.requestsService.removeRequest(id);
    }
}
