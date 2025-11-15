import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RegionEntity } from '../regions/entities/regions.entity';;
import { CitiesEntity } from '../regions/entities/cities.entity';
import { LocationService } from 'src/modules/locations/location.service';
import { PaginatorService } from 'src/common/paginator/paginator.service';
import { CreateRegionDto, FilterRegionDto } from '../regions/dtos/regions.dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { CreateCityDto, UpdateCitiesAvailabilityDto } from '../regions/dtos/cities.dto';

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
   const { search, available } = filterRegionDto;
  
   const query = this.regionRepo
     .createQueryBuilder('region')
     .leftJoinAndSelect('region.cities', 'city')
     .orderBy('region.createdAt', 'DESC')
     .select([
       'region.id',
       'region.arName',
       'region.enName',
       'region.latitude',
       'region.longitude',
       'region.createdAt',
       'city.id',
       'city.arName',
       'city.enName',
       'city.latitude',
       'city.longitude',
       'city.available',
     ]);
    
   if (search) {
     query.andWhere(
       '(region.arName ILIKE :search OR region.enName ILIKE :search)',
       { search: `%${search}%` },
     );
   }
  
   if (available !== undefined) {
     query.andWhere('city.available = :available', { available });
   }
  
   const regions = await query.getMany();
  
   const filteredRegions = available !== undefined
     ? regions.filter(r => r.cities.some(c => c.available === available))
     : regions;
  
   return filteredRegions;
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

  async removeCity(cityIds: number[], lang: LanguagesEnum): Promise<void> {
    const citities = await this.cityRepo.find({ where: { id: In(cityIds) } });
    if (citities.length != cityIds.length) {
      throw new NotFoundException(
        lang === LanguagesEnum.ARABIC ? 'المدينة غير موجودة' : 'City not found',
      );
    }
    for(let i=0; i < citities.length ; i++){
      await this.cityRepo.remove(citities[i]);
    }
  }

  async updateCitiesAvailability(
    UpdateCitiesAvailabilityDto: UpdateCitiesAvailabilityDto,
    lang: LanguagesEnum
  ): Promise<void> {
    const {cityIds, available} = UpdateCitiesAvailabilityDto;
    if (!cityIds || cityIds.length === 0) {
      throw new BadRequestException(
        lang === LanguagesEnum.ARABIC
          ? 'يجب تحديد معرفات المدن'
          : 'City IDs are required'
      );
    }

    const cities = await this.cityRepo.find({
      where:{id: In(cityIds)},
      select:{id:true, available:true}
      });

    if (cities.length === 0) {
      throw new NotFoundException(
        lang === LanguagesEnum.ARABIC
          ? 'لم يتم العثور على أي مدينة'
          : 'No cities found'
      );
    }

    for (const city of cities) {
      city.available = available;
    }

    await this.cityRepo.save(cities);
  }

}
