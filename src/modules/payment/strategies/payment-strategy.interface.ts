import { LanguagesEnum } from 'src/common/enums/lang.enum';

export interface PaymentCheckoutResult {
  paymentId: string;
  url: string;
}

export interface PaymentStrategy {
  checkout(
    amount: number,
    currency: string,
    userInfo: { name: string; phone: string; email: string },
    lang: LanguagesEnum
  ): Promise<PaymentCheckoutResult>;

  registerWebhook?(): Promise<any>;
}
