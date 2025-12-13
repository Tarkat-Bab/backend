import { Injectable } from '@nestjs/common';
import { FaqsService } from 'src/modules/faqs/faqs.service';
import { CreateFaqDto } from 'src/modules/faqs/dtos/create-faq.dto';
import { UpdateFaqDto } from 'src/modules/faqs/dtos/update-faq.dto';
import { FilterFaqDto } from 'src/modules/faqs/dtos/filter-faq.dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';

@Injectable()
export class DashboardFaqsService {
  constructor(private readonly faqsService: FaqsService) {}

  async create(createFaqDto: CreateFaqDto, lang: LanguagesEnum) {
    return this.faqsService.create(createFaqDto, lang);
  }

  async findAll(filterFaqDto: FilterFaqDto, lang: LanguagesEnum) {
    return this.faqsService.findAllForDashboard(filterFaqDto, lang);
  }

  async findOne(id: number, lang: LanguagesEnum) {
    return this.faqsService.findOneForDashboard(id, lang);
  }

  async update(id: number, updateFaqDto: UpdateFaqDto, lang: LanguagesEnum) {
    return this.faqsService.update(id, updateFaqDto, lang);
  }

  async remove(id: number, lang: LanguagesEnum) {
    return this.faqsService.remove(id, lang);
  }
}
