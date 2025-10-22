import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsMedia } from './entities/reports_media.entity';
import { ReportsEntity } from './entities/reports.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { RequestsModule } from '../requests/requests.module';

@Module({
    imports: [
        UsersModule,
        RequestsModule,
        TypeOrmModule.forFeature([ReportsEntity, ReportsMedia])
    ],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService],
})
export class ReportsModule {}
