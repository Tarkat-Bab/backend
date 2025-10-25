import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dtos/create-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ReviewsEntity } from './entities/review.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/services/users.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { FilterReviewDto } from './dtos/filter-review.dto';
import { PaginatorService } from 'src/common/paginator/paginator.service';
import { TechnicalProfileEntity } from '../users/entities/technical_profile.entity';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(ReviewsEntity)
        private reviewsRepository: Repository<ReviewsEntity>,
        private readonly usersService: UsersService,
        private readonly paginatorService: PaginatorService,
    ){}

    async createReview(userId: number, technicianId: number, createReviewDto: CreateReviewDto, lang: LanguagesEnum) {
        const { rate, comment } = createReviewDto;

        const [user, userTechnician] = await Promise.all([
            this.usersService.findOne(userId, lang),
            this.usersService.findOne(technicianId, lang),
        ]);

        const technicianProfile = await this.usersService.findTechnicianById(userTechnician.techid, lang);
        const avgRating = this.calculateAverageRating(technicianProfile.reviews, rate);

        technicianProfile.avgRating = avgRating;
        await this.usersService.saveTechnicalProfile(technicianProfile);

        const review = this.reviewsRepository.create({
            rate,
            comment,
            user: { id: user.u_id },
            technician: technicianProfile,
        });

        return this.reviewsRepository.save(review);
    }

    async getReviews(technicianId: number,filterReviewDto: FilterReviewDto, lang: LanguagesEnum) {
        const limit = filterReviewDto.limit || 10;
        const page  = filterReviewDto.page  || 1;
        const [reviews, total] = await this.reviewsRepository.findAndCount({
            where: {
                deleted: false,
                technician: [
                    { user: { id: technicianId }, deleted: false },
                    { id: technicianId, deleted: false },
                ],
            },
            relations: ['user'],
            select:{
                id:true,
                rate:true,
                comment:true,
                createdAt:true,
                user:{
                    id:true,
                    username:true,
                    image:true,
                },
            },
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return this.paginatorService.makePaginate(reviews, total, limit, page);
    }

    

    private calculateAverageRating(reviews: ReviewsEntity[], newRating: number): number {
        if (!reviews || reviews.length === 0) {
            return newRating;
        }
        const total = reviews.reduce((acc, review) => acc + review.rate, 0);
        console.log('Total rating from existing reviews:', total);
        console.log('Number of existing reviews:', reviews.length);
        return total / reviews.length;
    }
}
