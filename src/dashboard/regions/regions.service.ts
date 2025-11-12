import { Injectable } from '@nestjs/common';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { RegionsService } from 'src/modules/regions/regions.service';
import { CreateRegionDto, FilterRegionDto } from 'src/modules/regions/dtos/regions.dto';

import { CreateCityDto } from 'src/modules/regions/dtos/cities.dto';

@Injectable()
export class DashboardRegionsService {
  constructor(
    private readonly regionService: RegionsService,
  ) {}

  async createRegion(data: CreateRegionDto, lang: LanguagesEnum){
    return  this.regionService.createRegion(data, lang);
  }

  async findAllRegions(filterRegionDto: FilterRegionDto){
      return  this.regionService.findAllRegions(filterRegionDto);
  }

  async findRegionById(id: number, lang: LanguagesEnum) {
    return  this.regionService.findRegionById(id, lang);
  }

  async updateRegion(id: number, data:CreateRegionDto, lang: LanguagesEnum){
    return this.regionService.updateRegion(id, data, lang);
  }

  async deleteRegion(id: number, lang: LanguagesEnum) {
    await this.regionService.deleteRegion(id, lang);
  }

  async addCityToRegion(cityData: CreateCityDto, lang: LanguagesEnum) {
    return this.regionService.addCityToRegion(cityData, lang);
  }

  async removeCity(cityId: number, lang: LanguagesEnum) {
    return this.regionService.removeCity(cityId, lang);
  }
}
