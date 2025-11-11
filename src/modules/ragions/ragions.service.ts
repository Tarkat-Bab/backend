import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegionEntity } from './entities/ragions.entity';
import { CitiesEntity } from './entities/cities.entity';
import { LocationService } from 'src/modules/locations/location.service';
import { PaginatorService } from 'src/common/paginator/paginator.service';
import { CreateRegionDto, FilterRagionDto } from './dtos/ragions.dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(RegionEntity)
    private readonly regionRepo: Repository<RegionEntity>,

    @InjectRepository(CitiesEntity)
    private readonly cityRepo: Repository<CitiesEntity>,
    private readonly locationService: LocationService,
    private readonly paginatorService: PaginatorService
  ) {}

  async createRegion(data: CreateRegionDto): Promise<RegionEntity> {
    const region = this.regionRepo.create(data);
    return this.regionRepo.save(region);
  }

  async findAllRegions(filterRegionDto: FilterRagionDto): Promise<RegionEntity[]> {
    const page = filterRegionDto.page || 1;
    const limit = filterRegionDto.limit || 20;

    const skip = (page - 1) * limit;

    return this.regionRepo.find({
      relations: ['cities'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
  }


  async findRegionById(id: number, lang: LanguagesEnum): Promise<RegionEntity> {
     const region = await this.regionRepo.findOne({
       where: { id },
       relations: ['cities'],
     });
         if (!region) {
       throw new NotFoundException(
         lang === LanguagesEnum.ARABIC ? 'المنطقة غير موجودة' : 'Region not found',
       );
     }
         return region;
   }

  async updateRegion(id: number, data:CreateRegionDto, lang: LanguagesEnum): Promise<RegionEntity> {
    const region = await this.findRegionById(id, lang);
    Object.assign(region, data);
    return this.regionRepo.save(region);
  }

  async deleteRegion(id: number, lang: LanguagesEnum): Promise<void> {
    const region = await this.findRegionById(id, lang);
    await this.regionRepo.remove(region);
  }

  async addCityToRegion(regionId: number, cityData: Partial<CitiesEntity>, lang: LanguagesEnum): Promise<CitiesEntity> {
    const region = await this.findRegionById(regionId, lang);
    const city = this.cityRepo.create({ ...cityData, region });
    return this.cityRepo.save(city);
  }

  async removeCity(cityId: number, lang: LanguagesEnum): Promise<void> {
    const city = await this.cityRepo.findOne({ where: { id: cityId } });
    if (!city) {
      throw new NotFoundException(
        lang === LanguagesEnum.ARABIC ? 'المدينة غير موجودة' : 'City not found',
      );
    }
    await this.cityRepo.remove(city);
  }
}
