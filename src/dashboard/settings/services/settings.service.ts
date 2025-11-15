import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SettingEntity } from "../entities/setting.entity";
import { UpdateSettingDto } from "../dtos/update-settings.dto";

@Injectable()
export class DashboardSettingsService {
    constructor(
        @InjectRepository(SettingEntity)
        private readonly settingRepository: Repository<SettingEntity>,
    ){}

    async getSetting() {
        return this.settingRepository.findOne({ where: {} });
    }

    async updateSettings(dto: UpdateSettingDto){
        const setting = await this.getSetting();
        return await this.settingRepository.update(setting.id, dto);
    }
}