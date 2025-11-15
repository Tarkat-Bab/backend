import { Module } from "@nestjs/common";
import { SettingsModule } from "src/dashboard/settings/settings.module";
import { DeviceVersionsController } from "./device-versions.controller";
import { DeviceVersionsService } from "./device-versions.service";


@Module({
  imports: [SettingsModule],
  controllers: [DeviceVersionsController],
  providers: [ DeviceVersionsService ],
  exports: [ DeviceVersionsService ],
})
export class DeviceVersionsModule {}