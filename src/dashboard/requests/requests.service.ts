import { Body, Injectable } from '@nestjs/common';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { FilterRequestDto } from 'src/modules/requests/dto/filter-request.dto';
import { RequestsService } from 'src/modules/requests/services/requests.service';

@Injectable()
export class DashboardRequestsService {
    constructor(
        private readonly requestsService: RequestsService,
    ) {}

    async findAll(filter: FilterRequestDto, lang: LanguagesEnum) {
        return this.requestsService.findAllServiceRequests(filter, lang, null, null, true);
    }

    async findOne(id: number, lang: LanguagesEnum) {
        return this.requestsService.findRequestById(id, lang);
    }

    async findServiceRequestsByUserId(userId: number, lang: LanguagesEnum) {
        return this.requestsService.findServiceRequestsByUserId(userId, lang);
    }

    async findServiceRequestsByTechnicianId(technicianId: number, lang: LanguagesEnum) {
        return this.requestsService.findServiceRequestsByTechnicianId(technicianId, lang);
    }
}
