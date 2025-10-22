import { Module } from "@nestjs/common";
import { DashboardReportsController } from "./reports.controller";
import { DashboardReportsService } from "./reports.service";
import { ReportsModule } from "src/modules/reports/reports.module";

@Module({
  imports: [ ReportsModule],
  controllers: [DashboardReportsController],
  providers: [DashboardReportsService],
})
export class DashboardReportsModule {}
