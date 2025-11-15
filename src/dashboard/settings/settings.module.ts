import { Module } from "@nestjs/common";
import { SettingEntity } from "./entities/setting.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DeviceVersionsEntity } from "./entities/device-versions.entity";
import { DashboardSettingsService } from "./services/settings.service";
import { DashboardDeviceVersionsService } from "./services/device-versions.service";
import { DashboardDeviceVersionsController } from "./controllers/device-versions.controller";
import { DashboardSettingsController } from "./controllers/settings.controller";

@Module({
  imports: [TypeOrmModule.forFeature([SettingEntity, DeviceVersionsEntity])],
  controllers: [DashboardDeviceVersionsController, DashboardSettingsController],
  providers: [DashboardSettingsService, DashboardDeviceVersionsService],
  exports: [DashboardSettingsService, DashboardDeviceVersionsService],
})
export class SettingsModule {}