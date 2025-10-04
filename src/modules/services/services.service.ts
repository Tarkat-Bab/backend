import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ServiceEntity } from './entities/service.entity';
import { Repository } from 'typeorm';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

@Injectable()
export class ServicesService {
    constructor(
        @InjectRepository(ServiceEntity)
        private readonly serviceRepo: Repository<ServiceEntity>,
    ){}

    async findAll(): Promise<ServiceEntity[]> {
        return await this.serviceRepo.find();
    }

    async findOne(id: number, lang: LanguagesEnum): Promise<ServiceEntity> {
        const service = await this.serviceRepo.findOne({where: {id}});
        if (!service) {
            throw new NotFoundException(lang === LanguagesEnum.ENGLISH ? 'Service not found' : 'الخدمة غير موجودة');
        }
        return service;
    }
}
