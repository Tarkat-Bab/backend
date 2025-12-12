import { forwardRef, Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { PaymentStrategy } from "../interfaces/payment.interface";
import { LanguagesEnum } from "src/common/enums/lang.enum";
import { PaymentService } from "../payment.service";
import { PaylinkService } from "../paylink.service";

@Injectable()
export class PaylinkStrategy implements PaymentStrategy {
    constructor(
        @Inject(forwardRef(() => PaymentService))
        private readonly paymentService: PaymentService,
        private readonly paylinkService: PaylinkService,
    ) {}

    /**
     * This method to checkout and create a payment at database
     * @returns 
     */
    async checkout(userId: number, offerId: number, lang: LanguagesEnum, couponId?: number) {
        const payment = await this.paymentService.createPayment(userId, offerId, lang, undefined, couponId);
        
        const orderNumber = `ORDER-${Date.now()}-${offerId}`;
        
        const baseUrl = process.env.BASE_URL.endsWith('/') 
            ? process.env.BASE_URL.slice(0, -1) 
            : process.env.BASE_URL;

        // Use discounted amount if available, otherwise use original amount
        const finalAmount = payment.totalClientAmountAfterDiscount || payment.totalClientAmount;

        const invoiceData = {
            orderNumber,
            amount: finalAmount,
            callBackUrl: `${baseUrl}/payments/paylink`,
            cancelUrl: `${baseUrl}/payments/paylink`,
            clientName: payment.user.username,
            clientEmail: payment.user.email || undefined,
            clientMobile: payment.user.phone,
            currency: 'SAR',
            products: [
                {
                    title: payment.offer.request?.title || 'Service Payment',
                    price: payment.offer.price,
                    qty: 1,
                    description: `Payment for offer #${offerId}`
                }
            ],
            displayPending: true,
            note: `Payment for offer #${offerId}`
        };

        try {
            const response = await this.paylinkService.addInvoice(invoiceData);

            if (!response.success) {
                await this.paymentService.remove(payment.id);
                throw new InternalServerErrorException(
                    lang === LanguagesEnum.ARABIC ? "فشل في عملية الدفع" : "Failed to payment process"
                );
            }

            await this.paymentService.updatePaymentInfo(payment.id, response.transactionNo, response.orderStatus);
            
            // Save Paylink transaction details
            await this.paymentService.savePaylinkTransaction(
                payment.id,
                response.transactionNo,
                orderNumber,
                response.amount,
                response.orderStatus
            );
            
            return {
                transactionNo: response.transactionNo,
                url: response.url,
                mobileUrl: response.mobileUrl
            };
        } catch (error: any) {
            console.error("❌ Checkout error:", error.response?.data || error.message);
            await this.paymentService.remove(payment.id);
            throw new InternalServerErrorException(
                lang === LanguagesEnum.ARABIC ? "فشل في عملية الدفع" : "Failed to payment process"
            );
        }
    }


    /**
     * This method registers a webhook URL with Paylink to receive payment notifications.
     * Note: Paylink doesn't require webhook registration like Tabby.
     * Webhooks are configured in the Paylink dashboard.
     * @returns A success message
     */
    async registerWebhook() {
        console.log("✅ Paylink webhook is configured in the Paylink dashboard");
        console.log(`   Webhook URL: ${process.env.BASE_URL}/payments/paylink/webhook`);
        return {
            message: "Paylink webhooks are configured in the Paylink dashboard",
        };
    }
}