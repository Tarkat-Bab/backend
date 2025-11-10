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


    async findAll(lang: LanguagesEnum) {
        const nationalities = await this.nationalityRepo.find( {
                select: {
                    id: true,
                    enName: lang === LanguagesEnum.ENGLISH ? true : false,
                    arName: lang === LanguagesEnum.ARABIC ? true : false
                },
                order: { id: 'ASC' }
            });

        return nationalities.map((n) => {
            return {
              id: n.id,
              name: lang === LanguagesEnum.ARABIC ? n.arName : n.enName,
            };
        });
    }

    async findOne(id: number, lang: LanguagesEnum){
        const nationality =  await this.nationalityRepo.findOne({where: {id}});

        if(!nationality) {
             throw new NotFoundException(lang === LanguagesEnum.ARABIC ? 'الجنسية غير موجودة' :  'Nationality not found');
        }

        return nationality;
    }
}
