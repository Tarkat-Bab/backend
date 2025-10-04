import { Controller, Get } from '@nestjs/common';
import { isPublic } from 'src/common/decorators/public.decorator';
import { NationaltiesService } from './nationalties.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { ApiHeader } from '@nestjs/swagger';

@isPublic()
@Controller('nationalties')
export class NationaltiesController {
    constructor(
        private readonly nationaltiesService: NationaltiesService,
    ) {}

    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false,
    })
    @Get()
    async getNationalties(
        @Language() lang?: LanguagesEnum
    ) {
        return this.nationaltiesService.findAll(lang);
    }
}
