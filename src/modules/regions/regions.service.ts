import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegionEntity } from '../regions/entities/Regions.entity';
import { CitiesEntity } from '../regions/entities/cities.entity';
import { LocationService } from 'src/modules/locations/location.service';
import { PaginatorService } from 'src/common/paginator/paginator.service';
import { CreateRegionDto, FilterRegionDto } from '../regions/dtos/Regions.dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { CreateCityDto } from '../regions/dtos/cities.dto';

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

  async createRegion(data: CreateRegionDto, lang: LanguagesEnum): Promise<RegionEntity> {
    const checkRegion = await this.regionRepo.findOne({where:[
      {arName: data.name},
      {enName: data.name},
    ]});

    if(checkRegion){
      throw new BadRequestException(
        lang == LanguagesEnum.ARABIC ? `منطقة ${data.name} موجودة بالفعل` :  `${data.name} already exists.`
      )
    }

    let saveLocation = null;
    if(data.name){
      saveLocation = await this.locationService.getLatLongFromText(data.name, lang);
    }
    // else{
    //   saveLocation = await this.locationService.geolocationAddress(data.latitude, data.longitude);
    // }
    const region = this.regionRepo.create({
      arName   : saveLocation.ar_address,
      enName   : saveLocation.en_address,
      latitude : saveLocation.latitude,
      longitude: saveLocation.longitude,
    });
    return this.regionRepo.save(region);
  }

  async updateRegion(id: number, data:CreateRegionDto, lang: LanguagesEnum): Promise<RegionEntity> {
    const region = await this.findRegionById(id, lang);

    let saveLocation = null;
    if(data.name){
      saveLocation = await this.locationService.getLatLongFromText(data.name, lang);
    }else{
      saveLocation = await this.locationService.geolocationAddress(data.latitude, data.longitude);
    }

    region.arName   = saveLocation.ar_address;
    region.enName   = saveLocation.en_address;
    region.latitude = saveLocation.latitude;
    region.longitude= saveLocation.longitude;

    return this.regionRepo.save(region);
  }

  async findAllRegions(filterRegionDto: FilterRegionDto) {
    const page = filterRegionDto.page || 1;
    const limit = filterRegionDto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any[] = [];

    if (filterRegionDto.search) {
      where.push(
        { arName: filterRegionDto.search },
        { enName: filterRegionDto.search },
      );
    }

    const [result, count] = await this.regionRepo.findAndCount({
      where: where.length ? where : {}, 
      relations: ['cities'],
      order: { createdAt: 'DESC' },
      select:{
          id:true, arName:true, enName:true, latitude:true, longitude:true, createdAt:true,
          cities:{id:true, arName:true, enName:true, latitude:true, longitude:true,}
      },
      skip,
      take: limit,
    });

    return this.paginatorService.makePaginate(result, count, limit, page);
  }


  async findRegionById(id: number, lang: LanguagesEnum): Promise<RegionEntity> {
      const region = await this.regionRepo.findOne({
        where: { id, deleted: false },
        relations: ['cities'],
        select:{
          id:true, arName:true, enName:true, latitude:true, longitude:true,
          cities:{id:true, arName:true, enName:true, latitude:true, longitude:true,}
        }
      });
          if (!region) {
        throw new NotFoundException(
          lang === LanguagesEnum.ARABIC ? 'المنطقة غير موجودة' : 'Region not found',
        );
      }
      return region;
  }

  async deleteRegion(id: number, lang: LanguagesEnum): Promise<void> {
    const region = await this.findRegionById(id, lang);
    await this.regionRepo.remove(region);
  }

  async addCityToRegion(cityData: CreateCityDto, lang: LanguagesEnum): Promise<CitiesEntity> {
    const region = await this.findRegionById(cityData.regionId, lang);
    let saveLocation = null;
    if(cityData.name){
      saveLocation = await this.locationService.getLatLongFromText(cityData.name, lang);
    }else{
      saveLocation = await this.locationService.geolocationAddress(cityData.latitude, cityData.longitude);
    }
    const city = this.cityRepo.create({
      arName   : saveLocation.ar_address,
      enName   : saveLocation.en_address,
      latitude : saveLocation.latitude,
      longitude: saveLocation.longitude,
      region
    });
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
