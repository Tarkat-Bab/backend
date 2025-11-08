import { Injectable } from '@nestjs/common';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { PaginatorInput } from 'src/common/paginator/types/paginate.input';
import { FilterRequestDto } from 'src/modules/requests/dto/filter-request.dto';
import { RequestOffersService } from 'src/modules/requests/services/requests-offers.service';
import { RequestsService } from 'src/modules/requests/services/requests.service';

@Injectable()
export class DashboardRequestsService {
    constructor(
        private readonly requestsService: RequestsService,
        private readonly requestOffersService: RequestOffersService,
    ) {}

    async findAll(filter: FilterRequestDto, lang: LanguagesEnum) {
        return this.requestsService.findAllServiceRequests(filter, lang, null, null, true);
    }

    async findOne(id: number, lang: LanguagesEnum) {
        return this.requestsService.findRequestById(id, lang);
    }

    async findServiceRequestsByUserId(userId: number, filterUser: PaginatorInput, lang: LanguagesEnum) {
        return this.requestsService.findServiceRequestsByUserId(userId, filterUser, lang);
    }

    async findServiceRequestsByTechnicianId(id: number, filterTechnician: PaginatorInput, lang: LanguagesEnum) {
        return this.requestsService.findServiceRequestsByTechnicianId(id, filterTechnician, lang, true);
    }

    async removeOffer(offerId: number, lang: LanguagesEnum) {
        return this.requestOffersService.removeOffer(offerId, lang);
    }

}
