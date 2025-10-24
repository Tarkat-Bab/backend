import { Controller,Post, Get, Param, UseInterceptors, Body, UploadedFiles } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { ApiBearerAuth, ApiConsumes, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { post } from 'node_modules/axios/index.cjs';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFilter } from 'src/common/files/files.filter';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { CreateReportDto } from './dtos/create-report.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiBearerAuth()
@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
    constructor(
        private readonly reportsService: ReportsService,
    ) {}

    
    @Post()
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('images', { fileFilter: imageFilter }))
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false,
    })
    async createReport(
        @CurrentUser() user: any,
        @Body() createReportDto: CreateReportDto,
        @Language() lang: LanguagesEnum,
        @UploadedFiles() images: Express.Multer.File[],
    ){
        return this.reportsService.createReport(createReportDto, user.id, lang, images);
    }

    @Get('all/me')
    @ApiOperation({ summary: 'Create a new report (Client, Technician Api)' })
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false,
    })
    async getMine(
        @CurrentUser() user: any,
        @Language() lang: LanguagesEnum
    ){
        return this.reportsService.findReportsByUser(user.id, user.type, lang);
    }

    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false,
    })
    @Get(':id')
    async getReportById(
        @Param("id") id: number,
        @Language() lang: LanguagesEnum
    ) {
        return this.reportsService.findReportById(id, lang );
    }


    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language for the response (e.g., ar, en)',
        required: false,
    })
    @Get('/replies/:reportId')
    async getRepliesByReport(
        @Param("reportId") reportId: number,
        @Language() lang: LanguagesEnum
    ) {
        return this.reportsService.findRepliesByReport(reportId, lang);
    }   
}
