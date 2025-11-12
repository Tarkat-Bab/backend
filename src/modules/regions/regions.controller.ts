import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { FilterRegionDto } from '../regions/dtos/regions.dto';

@Controller('Regions')
export class RegionsController {
    constructor(
        private readonly regionsService: RegionsService
    ) {}

    @Get()
    @ApiOperation({ summary: 'Get all regions (with cities)' })
    findAll(
        @Query() filter: FilterRegionDto
    ) {
      return this.regionsService.findAllRegions(filter);
    }
}
