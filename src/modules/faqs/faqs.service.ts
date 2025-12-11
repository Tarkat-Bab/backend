import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaqEntity } from './entities/faq.entity';
import { CreateFaqDto } from './dtos/create-faq.dto';
import { UpdateFaqDto } from './dtos/update-faq.dto';
import { FilterFaqDto } from './dtos/filter-faq.dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { PaginatorService } from 'src/common/paginator/paginator.service';

@Injectable()
export class FaqsService {
  constructor(
    @InjectRepository(FaqEntity)
    private readonly faqRepository: Repository<FaqEntity>,
    private readonly paginatorService: PaginatorService,
  ) {}

  async create(createFaqDto: CreateFaqDto, lang: LanguagesEnum) {
    const faq = this.faqRepository.create(createFaqDto);
    await this.faqRepository.save(faq);

    return {
      message: lang === LanguagesEnum.ARABIC ? 'تم إضافة السؤال بنجاح' : 'FAQ created successfully',
      data: faq,
    };
  }

  async findAll(filterFaqDto: FilterFaqDto, lang: LanguagesEnum) {
    const { page, limit, isActive } = filterFaqDto;
    
    const selectFields = ['faq.id', 'faq.isActive', 'faq.createdAt', 'faq.updatedAt'];
    
    if (lang === LanguagesEnum.ARABIC) {
      selectFields.push('faq.questionAr', 'faq.answerAr');
    } else {
      selectFields.push('faq.questionEn', 'faq.answerEn');
    }

    const query = this.faqRepository
      .createQueryBuilder('faq')
      .select(selectFields)
      .where('faq.deleted = :deleted', { deleted: false })
      .orderBy('faq.createdAt', 'DESC');

    if (isActive !== undefined) {
      query.andWhere('faq.isActive = :isActive', { isActive });
    }

    const [result, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      message: lang === LanguagesEnum.ARABIC ? 'تم جلب الأسئلة بنجاح' : 'FAQs retrieved successfully',
      ...this.paginatorService.makePaginate(result, total, limit, page),
    };
  }

  async findOne(id: number, lang: LanguagesEnum) {
    const selectFields: (keyof FaqEntity)[] = ['id', 'isActive', 'createdAt', 'updatedAt'];
    
    if (lang === LanguagesEnum.ARABIC) {
      selectFields.push('questionAr', 'answerAr');
    } else {
      selectFields.push('questionEn', 'answerEn');
    }

    const faq = await this.faqRepository.findOne({
      where: { id, deleted: false },
      select: selectFields,
    });

    if (!faq) {
      throw new NotFoundException(
        lang === LanguagesEnum.ARABIC ? 'السؤال غير موجود' : 'FAQ not found',
      );
    }

    return {
      message: lang === LanguagesEnum.ARABIC ? 'تم جلب السؤال بنجاح' : 'FAQ retrieved successfully',
      data: faq,
    };
  }

  async update(id: number, updateFaqDto: UpdateFaqDto, lang: LanguagesEnum) {
    const faq = await this.faqRepository.findOne({
      where: { id, deleted: false },
    });

    if (!faq) {
      throw new NotFoundException(
        lang === LanguagesEnum.ARABIC ? 'السؤال غير موجود' : 'FAQ not found',
      );
    }

    Object.assign(faq, updateFaqDto);
    await this.faqRepository.save(faq);

    return {
      message: lang === LanguagesEnum.ARABIC ? 'تم تحديث السؤال بنجاح' : 'FAQ updated successfully',
      data: faq,
    };
  }

  async remove(id: number, lang: LanguagesEnum) {
    const faq = await this.faqRepository.findOne({
      where: { id, deleted: false },
    });

    if (!faq) {
      throw new NotFoundException(
        lang === LanguagesEnum.ARABIC ? 'السؤال غير موجود' : 'FAQ not found',
      );
    }

    faq.deleted = true;
    faq.deletedAt = new Date();
    await this.faqRepository.save(faq);

    return {
      message: lang === LanguagesEnum.ARABIC ? 'تم حذف السؤال بنجاح' : 'FAQ deleted successfully',
    };
  }

  // Dashboard methods - return all languages
  async findAllForDashboard(filterFaqDto: FilterFaqDto, lang: LanguagesEnum) {
    const { page, limit, isActive } = filterFaqDto;

    const query = this.faqRepository
      .createQueryBuilder('faq')
      .select([
        'faq.id',
        'faq.questionAr',
        'faq.questionEn',
        'faq.answerAr',
        'faq.answerEn',
        'faq.isActive',
        'faq.createdAt',
        'faq.updatedAt',
      ])
      .where('faq.deleted = :deleted', { deleted: false })
      .orderBy('faq.createdAt', 'DESC');

    if (isActive !== undefined) {
      query.andWhere('faq.isActive = :isActive', { isActive });
    }

    const [result, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      message: lang === LanguagesEnum.ARABIC ? 'تم جلب الأسئلة بنجاح' : 'FAQs retrieved successfully',
      ...this.paginatorService.makePaginate(result, total, limit, page),
    };
  }

  async findOneForDashboard(id: number, lang: LanguagesEnum) {
    const faq = await this.faqRepository.findOne({
      where: { id, deleted: false },
      select: {
        id: true,
        questionAr: true,
        questionEn: true,
        answerAr: true,
        answerEn: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!faq) {
      throw new NotFoundException(
        lang === LanguagesEnum.ARABIC ? 'السؤال غير موجود' : 'FAQ not found',
      );
    }

    return {
      message: lang === LanguagesEnum.ARABIC ? 'تم جلب السؤال بنجاح' : 'FAQ retrieved successfully',
      data: faq,
    };
  }
}
