import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsEntity } from './entities/review.entity';
import { PaginatorService } from 'src/common/paginator/paginator.service';
import { RequestsModule } from '../requests/requests.module';

@Module({
  imports: [
    RequestsModule,
    UsersModule,
    TypeOrmModule.forFeature([ReviewsEntity]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, PaginatorService]
})
export class ReviewsModule {}
