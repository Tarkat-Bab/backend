import { Module } from "@nestjs/common";
import { SettingEntity } from "./setting.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SettingsService } from "./settings.service";

@Module({
  imports: [TypeOrmModule.forFeature([SettingEntity])],
  controllers: [],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}