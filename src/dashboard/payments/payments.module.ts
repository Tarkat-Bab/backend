import { Module } from "@nestjs/common";
import { DashboarPaymentsService } from "./payments.service";
import { PaymentModule } from "src/modules/payment/payment.module";
import { DashboardPaymentsController } from "./payments.controller";

@Module({
  imports: [PaymentModule],
  controllers: [DashboardPaymentsController],
  providers: [DashboarPaymentsService]
})
export class DashboardPaymentsModule {}