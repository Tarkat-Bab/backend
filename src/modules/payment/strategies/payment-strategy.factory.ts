import { Injectable } from "@nestjs/common";
import { PaymentStrategy } from "../interfaces/payment.interface";
import { PaylinkStrategy } from "./paylink.startgy";
import { TabbyStrategy } from "./tabby.starategy";
import { PaymentMethodsEnum } from "../enums/payment.enum";

@Injectable()
export class PaymentStrategyFactory {
  constructor(
    private readonly paylink: PaylinkStrategy,
    private readonly tabby: TabbyStrategy,
  ) {}

  getStrategy(method: PaymentMethodsEnum): PaymentStrategy {
    switch (method) {
      case PaymentMethodsEnum.PAYLINK:
        return this.paylink;
      case PaymentMethodsEnum.TABBY:
        return this.tabby;
      default:
        throw new Error("Unsupported payment gateway");
    }
  }
}
