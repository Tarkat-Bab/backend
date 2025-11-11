import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { RegionsService } from './ragions.service';
import { FilterRagionDto } from './dtos/ragions.dto';

@Controller('ragions')
export class RagionsController {
    constructor(
        private readonly regionsService: RegionsService
    ) {}

    @Get()
    @ApiOperation({ summary: 'Get all regions (with cities)' })
    findAll(
        @Query() filter: FilterRagionDto
    ) {
      return this.regionsService.findAllRegions(filter);
    }
}
