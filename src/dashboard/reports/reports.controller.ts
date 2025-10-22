import { Body, Controller, Get, Param, Query } from "@nestjs/common";
import { DashboardReportsService } from "./reports.service";
import { FilterReportsDto } from "src/modules/reports/dtos/filter-type.dto";
import { ApiBearerAuth, ApiHeader, ApiTags } from "@nestjs/swagger";
import { Language } from "src/common/decorators/languages-headers.decorator";
import { LanguagesEnum } from "src/common/enums/lang.enum";

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller('dashboard/reports')
export class DashboardReportsController{
    constructor(
        private readonly reportService: DashboardReportsService
    ){}
    
    @Get()
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false,
    })
    async getAllReports(
        @Query() filter: FilterReportsDto,
        @Language() lang: LanguagesEnum,
    ){
        return this.reportService.findAllReports(filter, lang);
    }

    @Get(':id')
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false,
    })
    async getReport(
        @Param("id") id: number,
        @Language() lang: LanguagesEnum,
    ){
        return this.reportService.findReport(id, lang);
    }
}