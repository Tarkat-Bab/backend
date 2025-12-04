import axios from "axios";
import { forwardRef, Inject, Injectable, InternalServerErrorException } from "@nestjs/common";

import { PaymentService } from "../payment.service";
import { LanguagesEnum } from "src/common/enums/lang.enum";
import { PaymentStrategy } from "../interfaces/payment.interface";

@Injectable()
export class TabbyStrategy implements PaymentStrategy{
    constructor(
      @Inject(forwardRef(() => PaymentService))
      private readonly paymentService: PaymentService,
    ) {}

    /**
     * This method to checkout and create a payment at databse
     * @param userId 
     * @param offertId 
     * @param lang 
     * @returns 
     */
    async checkout(userId: number, offertId: number, lang: LanguagesEnum){
      const payment = await this.paymentService.createPayment(userId, offertId, lang);
      const payload = {
          payment: {
            amount: payment.totalClientAmount.toString(),
            currency: "SAR",
            buyer: {
              name: payment.user.username,
              phone: payment.user.phone,
              email: payment.user.email,
            },
          },
          lang,
          merchant_code: process.env.TABBY_MERCHANT_CODE
      }
      try {
        const response = await axios.post(process.env.TABBY_CHECKOUT_URL, payload, {
          headers: {
            Authorization: `Bearer ${process.env.TABBY_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if(response.status !== 200){
          await this.paymentService.remove(payment.id);
          throw new InternalServerErrorException(
              lang === LanguagesEnum.ARABIC ? "فشل في عمليه الدفع" : "Failed to payment process"
          );
        }

      await this.paymentService.updatePaymentInfo(payment.id, response.data.payment.id, response.data.payment.status)
      return {
          transactionNumber: response.data.payment.id,
          url: response.data.configuration.available_products.installments[0].web_url
        };
      } catch (error: any) {
          console.error("❌ Checkout error:", error.response?.data || error.message);
          await this.paymentService.remove(payment.id);
           throw new InternalServerErrorException(
            lang === LanguagesEnum.ARABIC ? "فشل في عمليه الدفع" : "Failed to payment process"
        );
      }
    }

    /**
     * This method registers a webhook URL with Tabby to receive payment notifications.
     * It runs once during the application startup.
     * @returns The response from the Tabby API after registering the webhook.
     */
    async registerWebhook() {
      try {
        const response = await axios.post(
          `${process.env.TABBY_API_URL}/webhooks`,
          {
            url: `${process.env.BASE_URL}/payments/webhook`,
            header: {
              title: "X-Tabby-Signature",          
              value: process.env.TABBY_WEBHOOK_SECRET 
            }
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.TABBY_SECRET_KEY}`,
              "Content-Type": "application/json",
              "X-Merchant-Code": process.env.TABBY_MERCHANT_CODE
            }
          }
        );
      
        console.log("✅ Tabby webhook registered:", response.data);
        return response.data;
      } catch (error: any) {
        console.error("❌ Failed to register Tabby webhook:", error.response?.data || error.message);
        throw new InternalServerErrorException("Failed to register Tabby webhook");
      }
    }

}