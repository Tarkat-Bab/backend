import { Injectable, NotFoundException } from '@nestjs/common';
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
import { ReportsRepliesEntity } from './entities/reports_replies.entity'; // Updated import
import { CreateReplyDto } from './dtos/create-replay.dto';
import { CloudflareService } from 'src/common/files/cloudflare.service';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(ReportsEntity)
        private readonly reportsRepo: Repository<ReportsEntity>,

        @InjectRepository(ReportsRepliesEntity)
        private readonly reportsRepliesRepo: Repository<ReportsRepliesEntity>,

        private readonly usersService: UsersService,
        private readonly requestsService: RequestsService,
        private readonly paginatorService: PaginatorService,
        private readonly cloudflareService: CloudflareService,
    ){}

    async createReport(createReportDto: CreateReportDto, userId: number,lang: LanguagesEnum, files?: Express.Multer.File[]) {
        const { requestId, images, ...rest } = createReportDto;
        const request    = await this.requestsService.findRequestById(requestId, lang, null);

        if(request.technician === null){
            throw new NotFoundException(
                lang === LanguagesEnum.ARABIC
                    ? 'الفني غير موجود.'
                    : 'Technician not found.'
            );  
        }

        const reporter   = await this.usersService.findOne(userId, lang);
        
        let reportedId: number;
        let type: UsersTypes;

        if(reporter.type === UsersTypes.USER){
            reportedId = request.technician.id;
            type = UsersTypes.USER;
        } else {
            reportedId = request.user.id;
            type = UsersTypes.TECHNICAL;
        }
        
        const reported   = await this.usersService.findOne(reportedId, lang);
    
        let reportMedia = [];
        if(files && files.length > 0){
            reportMedia = await Promise.all(
                files.map(async(file) => {
                    const uploadedFile =  await this.cloudflareService.uploadFile(file);
                    return {
                        media: uploadedFile.url,
                    };
                })
            );
        }

        // console.log(reporter, reported);
        const report = this.reportsRepo.create({
            ...rest,
            reportNumber: `RPT-${Date.now()}`,
            type,
            request,
            reporter: {id: reporter.u_id},
            reported: {id: reported.u_id},
            media: reportMedia,
        });

        return this.reportsRepo.save(report);
    }

    async findReportById(id: number, lang: LanguagesEnum) {
        const report = await  this.reportsRepo.findOne({
            where: { id, deleted: false, reporter: { deleted: false } , reported: {deleted: false}, request: { deleted: false } },
            relations: ['reporter', 'reported', 'request', 'request.service', 'replies'],
            select: {
                id: true,
                reportNumber: true,
                message: true,
                type: true,
                resolved: true,
                reason: true,
                createdAt: true,
                request:{
                    id: true,
                    title: true,
                    requestNumber: true,
                    createdAt : true,
                    service: {
                        id: true,
                        icone: true,
                        enName: true,
                        arName: true,
                    }
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
                },

                replies:{
                    id: true,
                    content: true,
                    createdAt: true,
                }
            },
        });

        if(!report){
            if(lang === LanguagesEnum.ARABIC){
                throw new NotFoundException('الابلاغ غير موجود');
            } else {
                throw new NotFoundException('Report not found');
            }
        }

        return report;
    }

    async findReportsByUser(userId: number, userType: UsersTypes, lang: LanguagesEnum) {
        return await this.reportsRepo.find({
            where: [
                { deleted: false, reporter: { id: userId, deleted: false }, request:{ deleted: false } },
                { deleted: false, reported: { id: userId, deleted: false }, request:{ deleted: false } },
            ],
            order: { createdAt: 'DESC' },
            relations: {request: true},
            select:{
                id: true,
                reportNumber: true,
                message: true,
                resolved: true,
                createdAt: true,
                request:{
                    id: true,
                    title: true,
                }
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
        .andWhere('report.resolved = :resolved', { resolved: false })
        .andWhere('request.deleted = false')
        .andWhere('reported.deleted = false')
        .andWhere('reporter.deleted = false')
        .orderBy('report.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .select([
          'report.id',
          'report.reportNumber',
          'report.message',
          'report.type',
          'report.createdAt',
          'report.reason',

          'reported.id',
          'reported.username',
          'reported.image',

          'reporter.id',
          'reporter.image',
          'reporter.username',

          'request.id',
          'request.title',
        ]);


      q.leftJoinAndSelect('reported.technicalProfile', 'reportedTech')
        .addSelect('COALESCE(reportedTech.avgRating, 0)', 'reported_avg_rating')
        .addSelect(subQuery => {
          return subQuery
            .select('COALESCE(COUNT(r.id),0)')
            .from('reviews', 'r')
            .where('r.technician_id = reportedTech.id'); 
        }, 'reported_total_reviews');

      q.leftJoinAndSelect('reporter.technicalProfile', 'reporterTech')
        .addSelect('COALESCE(reporterTech.avgRating, 0)', 'reporter_avg_rating')
        .addSelect(subQuery => {
          return subQuery
            .select('COALESCE(COUNT(r.id),0)')
            .from('reviews', 'r')
            .where('r.technician_id = reporterTech.id'); 
        }, 'reporter_total_reviews');

    
      const [reports, total] = await q.getManyAndCount();
      const raw = await q.getRawMany();

      const data = reports.map((report, index) => {
        const rawRow = raw[index] || {};
        return {
          ...report,
          reported: {
            ...report.reported,
            avgRating: Number(rawRow.reported_avg_rating) || 0,
            totalReviews: Number(rawRow.reported_total_reviews) || 0,
          },
          reporter: {
            ...report.reporter,
            avgRating: Number(rawRow.reporter_avg_rating) || 0,
            totalReviews: Number(rawRow.reporter_total_reviews) || 0,
          },
        };
      });

      return this.paginatorService.makePaginate(data, total, limit, page);
    }

    async createReply(reportId: number, createReplyDto: CreateReplyDto, lang: LanguagesEnum) {
        const report = await this.reportsRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new NotFoundException(
                lang === LanguagesEnum.ARABIC
                    ? 'البلاغ غير موجود.'
                    : 'Report not found.'
            )
        }

        report.resolved = true;
        await this.reportsRepo.save(report);

        const reply = this.reportsRepliesRepo.create({
            ...createReplyDto,
            report: report,
        });

        return await this.reportsRepliesRepo.save(reply);
    }

    async findRepliesByReport(reportId: number, lang: LanguagesEnum) {
        const report = await this.reportsRepo.findOne({ where: { id: reportId, request: { deleted : false}, reported:{deleted:false}, reporter:{ deleted:false} }, });
        if (!report) {
            throw new NotFoundException(
                lang === LanguagesEnum.ARABIC
                    ? 'البلاغ غير موجود.'
                    : 'Report not found.'
            )
        }
        return await this.reportsRepliesRepo.find({
            where: { report: { id: reportId } },
            order: { createdAt: 'DESC' },
        });
    }

    async reportsAnalysis(){
        return await this.reportsRepo.count({
            where: { deleted: false },
        });
    }
}
