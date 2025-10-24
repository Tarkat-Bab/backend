import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dtos/create-report.dto';
import { Repository } from 'typeorm';
import { ReportsEntity } from './entities/reports.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from '../users/services/users.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { RequestsService } from '../requests/services/requests.service';
import { UsersTypes } from 'src/common/enums/users.enum';
import { PaginatorService } from 'src/common/paginator/paginator.service';
import { FilterReportsDto } from './dtos/filter-type.dto';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(ReportsEntity)
        private readonly reportsRepo: Repository<ReportsEntity>,
        private readonly usersService: UsersService,
        private readonly requestsService: RequestsService,
        private readonly paginatorService: PaginatorService,
    ){}

    async createReport(createReportDto: CreateReportDto, userId: number,lang: LanguagesEnum, files?: Express.Multer.File[]) {
        const { requestId, reportedId, images, ...rest } = createReportDto;
    
        const reporter   = await this.usersService.findOne(userId, lang);
        const request    = await this.requestsService.findRequestById(requestId, lang, null);
        const reported   = await this.usersService.findOne(reportedId, lang);
        const requesterType =  reporter.type;
    
        let reportMedia = [];
        if(files && files.length > 0){
            // reportMedia = await Promise.all(images.map(async (image) => {
            //     const savedImage = await this.cloudflareService.uploadFileToCloudflare(image.path);
            //     return {
            //         url: savedImage.url,
            //         id: savedImage.id,
            //     };
            // }));
        }

        const report = this.reportsRepo.create({
            ...rest,
            reportNumber: `RPT-${Date.now()}`,
            type      : requesterType === UsersTypes.USER ? UsersTypes.USER : UsersTypes.TECHNICAL, // the reporter type
            reporter  : requesterType === UsersTypes.USER ? reporter : reported,
            reported  : requesterType === UsersTypes.USER ? reported : reporter,
            media: reportMedia,
            request,
        });

        return this.reportsRepo.save(report);
    }

    async findReportById(id: number, lang: LanguagesEnum) {
        const report = await  this.reportsRepo.findOne({
            where: { id, deleted: false, reporter: { deleted: false } , reported: {deleted: false}, request: { deleted: false } },
            relations: ['reporter', 'reported', 'request'],
            select: {
                id: true,
                reportNumber: true,
                message: true,
                type: true,
                resolved: true,
                createdAt: true,
                request:{
                    id: true,
                    title: true,
                    requestNumber: true,
                    createdAt : true
                },
                reporter: {
                    id: true,
                    username: true,
                    image: true,
                    phone: true,
                    enAddress: true,
                    arAddress: true,
                },
                reported: {
                    id: true,
                    username: true,
                    image: true,
                    phone: true,
                    enAddress: true,
                    arAddress: true,
                }
            },
        });

        if(!report){
            if(lang === LanguagesEnum.ARABIC){
                throw new Error('الابلاغ غير موجود');
            } else {
                throw new Error('Report not found');
            }
        }

        return report;
    }

    async findReportsByUser(userId: number, userType: UsersTypes, lang: LanguagesEnum) {
        return await this.reportsRepo.find({
            where: [
                { deleted: false, reporter: { id: userId, deleted: false } },
                { deleted: false, reported: { id: userId, deleted: false } },
            ],
            order: { createdAt: 'DESC' },
            select:{
                id: true,
                reportNumber: true,
                message: true,
                resolved: true,
                createdAt: true,
            }
        });
    }

    async findAllReports(filterReportsDto: FilterReportsDto, lang: LanguagesEnum) {
        const page = filterReportsDto.page || 1;
        const limit = filterReportsDto.limit || 10;
        
        const q = this.reportsRepo.createQueryBuilder('report')
            .leftJoinAndSelect('report.request', 'request')
            .leftJoinAndSelect('report.reported', 'reported')
            .leftJoinAndSelect('report.reporter', 'reporter')
            .leftJoinAndSelect('report.media', 'media')
            .where('report.deleted = :deleted', { deleted: false })
            .andWhere('report.type = :type', { type: filterReportsDto.type })
            .orderBy('report.createdAt', 'DESC')
            .select([
            'report.id',
            'report.reportNumber',
            'report.message',
            'report.type',
            'report.createdAt',

            'reported.id',
            'reported.username',
            'reported.image',

            'reporter.id',
            'reporter.image',
            'reporter.username',
            ]);

        q.skip((page - 1) * limit).take(limit);
        const [reports, total] = await q.getManyAndCount();
        
        return this.paginatorService.makePaginate(reports, total, limit, page);
            
    }

}
