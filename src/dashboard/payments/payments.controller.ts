import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiTags } from "@nestjs/swagger";
import { LanguagesEnum } from "src/common/enums/lang.enum";
import { FilterPaymentsDto } from "src/modules/payment/dtos/filter-payments.dto";
import { DashboarPaymentsService } from "./payments.service";
import { Language } from "src/common/decorators/languages-headers.decorator";
import { PaymentAnalyticsDto } from "src/modules/payment/dtos/payment-analytics.dto";

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller('dashboard/payments')
export class DashboardPaymentsController {
    constructor(
        private readonly paymentsService: DashboarPaymentsService,
    ){}

    @Get()
    @ApiHeader({
       name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false,
    })
    async list(
        @Query() filterPaymentsDto: FilterPaymentsDto,
        @Language() lang: LanguagesEnum
    ) {
        return this.paymentsService.list(filterPaymentsDto, lang)
    }

    @Get('analytics')
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language header',
        required: false,
        example: 'ar',
    })
    async getPaymentAnalytics(
        @Query() analyticsDto: PaymentAnalyticsDto,
        @Language() lang: LanguagesEnum
    ) {
        return await this.paymentsService.getPaymentAnalytics(analyticsDto, lang);
    }
}