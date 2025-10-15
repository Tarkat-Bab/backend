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
        return this.requestsService.findAllServiceRequests(filter, lang);
    }

    async findOne(id: number, lang: LanguagesEnum) {
        return this.requestsService.findServiceRequestById(id, lang);
    }
}
