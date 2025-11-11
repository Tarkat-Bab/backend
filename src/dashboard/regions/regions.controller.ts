import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { CreateRegionDto, FilterRegionDto } from 'src/modules/Regions/dtos/Regions.dto';
import { CreateCityDto } from 'src/modules/Regions/dtos/cities.dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { DashboardRegionsService } from 'src/dashboard/regions/Regions.service';
import { Language } from 'src/common/decorators/languages-headers.decorator';

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

  @Put(':id')
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

  @Delete('city/:cityId')
  async removeCity(
    @Param('cityId', ParseIntPipe) cityId: number,
    @Language() lang: LanguagesEnum,
  ) {
    return this.dashboardRegionsService.removeCity(cityId, lang);
  }
}
