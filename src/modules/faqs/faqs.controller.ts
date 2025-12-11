import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { FaqsService } from './faqs.service';
import { FilterFaqDto } from './dtos/filter-faq.dto';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

@ApiBearerAuth()
@ApiTags('FAQs')
@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

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
}
