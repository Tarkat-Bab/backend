import { Injectable } from '@nestjs/common';
import { PaymentStrategy, PaymentCheckoutResult } from './payment-strategy.interface';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

@Injectable()
export class PaymentContextService {
  private strategy: PaymentStrategy;

  setStrategy(strategy: PaymentStrategy): void {
    this.strategy = strategy;
  }

  async executeCheckout(
    amount: number,
    currency: string,
    userInfo: { name: string; phone: string; email: string },
    lang: LanguagesEnum
  ): Promise<PaymentCheckoutResult> {
    if (!this.strategy) {
      throw new Error('Payment strategy not set');
    }
    return this.strategy.checkout(amount, currency, userInfo, lang);
  }

  async registerWebhook(): Promise<any> {
    if (!this.strategy) {
      throw new Error('Payment strategy not set');
    }
    if (this.strategy.registerWebhook) {
      return this.strategy.registerWebhook();
    }
  }
}
