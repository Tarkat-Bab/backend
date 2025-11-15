import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Delete, Param, Body, Query, ParseIntPipe, Patch } from '@nestjs/common';
import { CreateRegionDto, FilterRegionDto } from 'src/modules/regions/dtos/regions.dto';

import { CreateCityDto, UpdateCitiesAvailabilityDto } from 'src/modules/regions/dtos/cities.dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { DashboardRegionsService } from './regions.service';

@ApiBearerAuth()
@ApiTags('Dashboard - Regions')
@ApiHeader({
  name: 'Accept-Language',
  description: 'Language for the response (e.g., ar, en)',
  required: false,
})
@Controller('dashboard/regions')
export class DashboardRegionsController {
  constructor(
    private readonly dashboardRegionsService: DashboardRegionsService,
  ) {}

  @Post()
  async createRegion(
    @Body() createRegionDto: CreateRegionDto,
    @Language() lang: LanguagesEnum,
  ) {
    return this.dashboardRegionsService.createRegion(createRegionDto, lang);
  }

  @Patch('cities/availability')
  async updateCitiesAvailability(
    @Body() updateCitiesAvailabilityDto: UpdateCitiesAvailabilityDto,
    @Language() lang: LanguagesEnum,
  ) {
    return this.dashboardRegionsService.updateCitiesAvailability(updateCitiesAvailabilityDto, lang);
  }


  @Get()
  async findAllRegions(
    @Query() filter: FilterRegionDto,
    @Language() lang: LanguagesEnum,
  ) {
    return this.dashboardRegionsService.findAllRegions(filter);
  }

  @Get(':id')
  async findRegionById(
    @Param('id', ParseIntPipe) id: number,
    @Language() lang: LanguagesEnum,
  ) {
    return this.dashboardRegionsService.findRegionById(id, lang);
  }

  @Patch(':id')
  async updateRegion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: CreateRegionDto,
    @Language() lang: LanguagesEnum,
  ) {
    return this.dashboardRegionsService.updateRegion(id, updateDto, lang);
  }

  @Delete(':id')
  async deleteRegion(
    @Param('id', ParseIntPipe) id: number,
    @Language() lang: LanguagesEnum,
  ) {
    return this.dashboardRegionsService.deleteRegion(id, lang);
  }

  @Post('city')
  async addCityToRegion(
    @Body() cityData: CreateCityDto,
    @Language() lang: LanguagesEnum,
  ) {
    return this.dashboardRegionsService.addCityToRegion(cityData, lang);
  }

  // @Delete('city/:cityId')
  // async removeCity(
  //   @Param('cityId', ParseIntPipe) cityIds: number[],
  //   @Language() lang: LanguagesEnum,
  // ) {
  //   return this.dashboardRegionsService.removeCity(cityId, lang);
  // }
}
