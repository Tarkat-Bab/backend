import { Injectable } from "@nestjs/common";
import { LanguagesEnum } from "src/common/enums/lang.enum";
import { FilterReportsDto } from "src/modules/reports/dtos/filter-type.dto";
import { ReportsService } from "src/modules/reports/reports.service";

@Injectable()
export class DashboardReportsService{
    constructor(
        private readonly reportsService: ReportsService,
    ){}

    async findAllReports(filter: FilterReportsDto, lang: LanguagesEnum){
        return this.reportsService.findAllReports(filter, lang);
    }

    async findReport(id: number, lang: LanguagesEnum){
        return this.reportsService.findReportById(id, lang);
    }
}