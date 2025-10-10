import { Module }      from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ServeStaticModule,
  ServeStaticModuleOptions,
} from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService    } from './app.service';

import { ResponseTransformInterceptor } from './common/Interceptors/response-transform';
import { AllExceptionsFilter } from './common/exceptions/all-exceptions.filter';

import { DatabaseModule  } from './databases/database.module';
import { PaginatorModule } from './common/paginator/paginator.module';
import { FilesModule     } from './common/files/files.module';
import { AuthModule      } from './modules/auth/auth.module';
import { UsersModule     } from './modules/users/users.module';
import { EmailModule     } from './modules/mailer/mailer.module';
import { SeedsModule } from './modules/seeds/seeds.module';
import { LocationsModule } from './modules/locations/locations.module';
import { ServicesModule } from './modules/services/services.module';
import { NationaltiesModule } from './modules/nationalties/nationalties.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RequestsModule } from './modules/requests/requests.module';
import { RequestsController } from './modules/requests/controllers/requests.controller';
import { RequestsService } from './modules/requests/services/requests.service';
import { ReportsModule } from './modules/reports/reports.module';
import { ReportsController } from './modules/reports/reports.controller';
import { ReportsService } from './modules/reports/reports.service';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ReviewsController } from './modules/reviews/reviews.controller';
import { ReviewsService } from './modules/reviews/reviews.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.development.env`,
      // envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (
        configService: ConfigService,
      ): ServeStaticModuleOptions[] => [
        {
          rootPath: join(__dirname, '..', 'tarket-bab-media'), // The physical directory
          serveRoot: '/tarket-bab-media/',
        },

        {
          rootPath: join(__dirname, 'assets'),
          serveRoot: '/assets/',
        },
      ],
      inject: [ConfigService],
    }),
    DatabaseModule,
    PaginatorModule,
    FilesModule,
    EmailModule,

    AuthModule,
    UsersModule,
    SeedsModule,
    LocationsModule,
    ServicesModule,
    NationaltiesModule,
    DashboardModule,
    RequestsModule, ReportsModule, ReviewsModule, ReviewsModule,
  ],
  controllers: [AppController, RequestsController, ReportsController, ReviewsController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },

    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    RequestsService, ReportsService, ReviewsService,
  ],
})
export class AppModule {}
