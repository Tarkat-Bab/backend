import { Injectable } from "@nestjs/common";
import { LanguagesEnum } from "src/common/enums/lang.enum";
import { CreateReplyDto } from "src/modules/reports/dtos/create-replay.dto";
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

    async createReply(reportId: number, replyDto: CreateReplyDto, lang: LanguagesEnum){
        return this.reportsService.createReply(reportId, replyDto, lang)
    }

}