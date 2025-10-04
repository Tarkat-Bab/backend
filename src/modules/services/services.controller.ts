import { Controller, Get } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ApiHeader } from '@nestjs/swagger';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { isPublic } from 'src/common/decorators/public.decorator';

@isPublic()
@Controller('services')
export class ServicesController {
    constructor(
        private readonly servicesService: ServicesService,
    ) {}


    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false,
    })
    @Get()
    async getServices(
        @Language() lang?: LanguagesEnum
    ) {
        return this.servicesService.findAll(lang);
    }
}
