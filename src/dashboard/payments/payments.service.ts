import { Injectable } from "@nestjs/common";
import { LanguagesEnum } from "src/common/enums/lang.enum";
import { FilterPaymentsDto } from "src/modules/payment/dtos/filter-payments.dto";
import { PaymentService } from "src/modules/payment/payment.service";

@Injectable()
export class DashboarPaymentsService {
    constructor(
        private readonly paymentsService: PaymentService,
    ){}

    async list(filterPaymentsDto: FilterPaymentsDto, lang: LanguagesEnum) {
        return this.paymentsService.listPayments(filterPaymentsDto, lang)
    }
}