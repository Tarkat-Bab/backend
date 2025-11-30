import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PaymentStrategy, PaymentCheckoutResult } from './payment-strategy.interface';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import axios from 'axios';

@Injectable()
export class TabbyPaymentStrategy implements PaymentStrategy {
  async checkout(
    amount: number,
    currency: string,
    userInfo: { name: string; phone: string; email: string },
    lang: LanguagesEnum
  ): Promise<PaymentCheckoutResult> {
    const payload = {
      payment: {
        amount: amount.toString(),
        currency,
        buyer: {
          name: userInfo.name,
          phone: userInfo.phone,
          email: userInfo.email,
        },
      },
      lang,
      merchant_code: process.env.TABBY_MERCHANT_CODE,
    };

    try {
      const response = await axios.post(process.env.TABBY_CHECKOUT_URL, payload, {
        headers: {
          Authorization: `Bearer ${process.env.TABBY_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status !== 200) {
        throw new InternalServerErrorException(
          lang === LanguagesEnum.ARABIC
            ? 'فشل في عمليه الدفع'
            : 'Failed to payment process'
        );
      }

      return {
        paymentId: response.data.payment.id,
        url: response.data.configuration.available_products.installments[0].web_url,
      };
    } catch (error: any) {
      console.error('❌ Tabby checkout error:', error.response?.data || error.message);
      throw error;
    }
  }

  async registerWebhook(): Promise<any> {
    try {
      const response = await axios.post(
        `${process.env.TABBY_API_URL}/webhooks`,
        {
          url: `${process.env.BASE_URL}/payments/webhook`,
          header: {
            title: 'X-Tabby-Signature',
            value: process.env.TABBY_WEBHOOK_SECRET,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.TABBY_SECRET_KEY}`,
            'Content-Type': 'application/json',
            'X-Merchant-Code': process.env.TABBY_MERCHANT_CODE,
          },
        }
      );

      console.log('✅ Tabby webhook registered:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        '❌ Failed to register Tabby webhook:',
        error.response?.data || error.message
      );
      throw new InternalServerErrorException('Failed to register Tabby webhook');
    }
  }
}
