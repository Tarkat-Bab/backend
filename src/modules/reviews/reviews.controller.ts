import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreateReviewDto } from './dtos/create-review.dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { FilterReviewDto } from './dtos/filter-review.dto';

@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}

    @Post(':technicianId')
    @ApiHeader({
        name: 'accept-language',
        description: 'Language',
        required: false,
    })
    async createReview(
        @CurrentUser() user: any,
        @Param('technicianId') technicianId: number,
        @Body() createReviewDto: CreateReviewDto,
        @Language() lang: LanguagesEnum
    ) {
        return this.reviewsService.createReview(user.id, technicianId, createReviewDto, lang);
    }

    @Get(':technicianId')
    @ApiHeader({
        name: 'accept-language',
        description: 'Language',
        required: false,
    })
    async getReviews(
        @Param('technicianId') technicianId: number,
        @Query() filterDto: FilterReviewDto,
        @Language() lang: LanguagesEnum
    ) {
        return this.reviewsService.getReviews(technicianId, filterDto, lang);
    }

}
