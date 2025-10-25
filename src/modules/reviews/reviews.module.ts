import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsEntity } from './entities/review.entity';
import { PaginatorService } from 'src/common/paginator/paginator.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([ReviewsEntity]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, PaginatorService]
})
export class ReviewsModule {}
