import { Injectable } from "@nestjs/common";
import { LanguagesEnum } from "src/common/enums/lang.enum";
import { FilterPaymentsDto } from "src/modules/payment/dtos/filter-payments.dto";
import { PaymentAnalyticsDto } from "src/modules/payment/dtos/payment-analytics.dto";
import { PaymentService } from "src/modules/payment/payment.service";

@Injectable()
export class DashboarPaymentsService {
    constructor(
        private readonly paymentsService: PaymentService,
    ){}

    async list(filterPaymentsDto: FilterPaymentsDto, lang: LanguagesEnum) {
        return this.paymentsService.listPayments(filterPaymentsDto, lang)
    }

    async getPaymentAnalytics(analyticsDto: PaymentAnalyticsDto, lang: LanguagesEnum){
        return {
            total: await this.paymentsService.getPaymentAnalytics(analyticsDto, lang),
            monthly: await this.paymentsService.getMonthlyAnalytics(lang)
        }
    }
}