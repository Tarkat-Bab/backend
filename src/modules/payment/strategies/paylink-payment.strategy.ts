import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PaymentStrategy, PaymentCheckoutResult } from './payment-strategy.interface';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import axios from 'axios';

@Injectable()
export class PaylinkPaymentStrategy implements PaymentStrategy {
  async checkout(
    amount: number,
    currency: string,
    userInfo: { name: string; phone: string; email: string },
    lang: LanguagesEnum
  ): Promise<PaymentCheckoutResult> {
    const payload = {
      amount: amount,
      currency: currency,
      clientName: userInfo.name,
      clientMobile: userInfo.phone,
      clientEmail: userInfo.email,
      orderNumber: `ORDER-${Date.now()}`,
      callBackUrl: `${process.env.BASE_URL}/payments/webhook`,
      note: lang === LanguagesEnum.ARABIC ? 'دفع خدمة' : 'Service Payment',
    };

    try {
      const response = await axios.post(
        `${process.env.PAYLINK_API_URL}/addInvoice`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYLINK_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data || !response.data.transactionNo) {
        throw new InternalServerErrorException(
          lang === LanguagesEnum.ARABIC
            ? 'فشل في عمليه الدفع'
            : 'Failed to payment process'
        );
      }

      return {
        paymentId: response.data.transactionNo,
        url: response.data.url,
      };
    } catch (error: any) {
      console.error('❌ Paylink checkout error:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        lang === LanguagesEnum.ARABIC
          ? 'فشل في عمليه الدفع عبر Paylink'
          : 'Failed to process Paylink payment'
      );
    }
  }

  async registerWebhook(): Promise<any> {
    console.log('✅ Paylink webhook configured via dashboard');
    // Paylink webhooks are typically configured via their dashboard
    // No API registration needed
    return { message: 'Paylink webhook should be configured in Paylink dashboard' };
  }
}
