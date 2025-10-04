import { Injectable, NotFoundException } from '@nestjs/common';
import { NationalityEntity } from './entities/nationality.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

@Injectable()
export class NationaltiesService {
    constructor(
        @InjectRepository(NationalityEntity)
        private readonly nationalityRepo: Repository<NationalityEntity> 
    ) { }


    async findAll(): Promise<NationalityEntity[]> {
        return await this.nationalityRepo.find();
    }

    async findOne(id: number, lang: LanguagesEnum){
        const nationality =  await this.nationalityRepo.findOne({where: {id}});

        if(!nationality) {
             throw new NotFoundException(lang === LanguagesEnum.ARABIC ? 'الجنسية غير موجودة' :  'Nationality not found');
        }

        return nationality;
    }
}
