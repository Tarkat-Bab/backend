import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SettingEntity } from "../entities/setting.entity";

@Injectable()
export class DashboardSettingsService {
    constructor(
        @InjectRepository(SettingEntity)
        private readonly settingRepository: Repository<SettingEntity>,
    ){}

    async getSetting() {
        return this.settingRepository.findOne({ where: {} });
    }
}