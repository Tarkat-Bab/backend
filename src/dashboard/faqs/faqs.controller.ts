import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardFaqsService } from './faqs.service';
import { CreateFaqDto } from 'src/modules/faqs/dtos/create-faq.dto';
import { UpdateFaqDto } from 'src/modules/faqs/dtos/update-faq.dto';
import { FilterFaqDto } from 'src/modules/faqs/dtos/filter-faq.dto';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller('dashboard/faqs')
export class DashboardFaqsController {
  constructor(private readonly faqsService: DashboardFaqsService) {}

  @Post()
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Language for the response (e.g., ar, en)',
    required: false,
  })
  async create(
    @Body() createFaqDto: CreateFaqDto,
    @Language() lang: LanguagesEnum,
  ) {
    return this.faqsService.create(createFaqDto, lang);
  }

  @Get()
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Language for the response (e.g., ar, en)',
    required: false,
  })
  async findAll(
    @Query() filterFaqDto: FilterFaqDto,
    @Language() lang: LanguagesEnum,
  ) {
    return this.faqsService.findAll(filterFaqDto, lang);
  }

  @Get(':id')
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Language for the response (e.g., ar, en)',
    required: false,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Language() lang: LanguagesEnum,
  ) {
    return this.faqsService.findOne(id, lang);
  }

  @Patch(':id')
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Language for the response (e.g., ar, en)',
    required: false,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFaqDto: UpdateFaqDto,
    @Language() lang: LanguagesEnum,
  ) {
    return this.faqsService.update(id, updateFaqDto, lang);
  }

  @Delete(':id')
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Language for the response (e.g., ar, en)',
    required: false,
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Language() lang: LanguagesEnum,
  ) {
    return this.faqsService.remove(id, lang);
  }
}
