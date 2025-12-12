import { LanguagesEnum } from "src/common/enums/lang.enum";

export interface PaymentStrategy {
    checkout(userId: number, offerId: number, lang: LanguagesEnum, couponId?: number): Promise<any>;
    registerWebhook(): Promise<any>
}
