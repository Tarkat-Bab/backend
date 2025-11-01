import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SettingEntity } from "./setting.entity";
import { Repository } from "typeorm";

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(SettingEntity)
        private readonly settingRepository: Repository<SettingEntity>,
    ){}

    async getSetting() {
        return this.settingRepository.findOne({ where: {} });
    }
}