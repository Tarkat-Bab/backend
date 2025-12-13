import { Module }      from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
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

import { SeedsModule }        from './modules/seeds/seeds.module';
import { ReportsModule }      from './modules/reports/reports.module';
import { ReviewsModule }      from './modules/reviews/reviews.module';
import { RequestsModule }     from './modules/requests/requests.module';
import { ServicesModule }     from './modules/services/services.module';
import { DatabaseModule  }    from './databases/database.module';
import { PaginatorModule }    from './common/paginator/paginator.module';
import { FilesModule     }    from './common/files/files.module';
import { AuthModule      }    from './modules/auth/auth.module';
import { UsersModule     }    from './modules/users/users.module';
import { EmailModule     }    from './modules/mailer/mailer.module';
import { LocationsModule }    from './modules/locations/locations.module';
import { DashboardModule }    from './dashboard/dashboard.module';
import { NationaltiesModule } from './modules/nationalties/nationalties.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentModule } from './modules/payment/payment.module';
import { RegionsModule } from './modules/regions/regions.module';
import { DeviceVersionsModule } from './modules/versions/device-versions..module';
import { ChatModule } from './modules/chat/chat.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { FaqsModule } from './modules/faqs/faqs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Use environment-specific .env file if it exists, otherwise rely on environment variables
      envFilePath: process.env.NODE_ENV 
        ? `.${process.env.NODE_ENV}.env` 
        : `.development.env`,
      // Don't fail if env file doesn't exist (production typically uses env vars directly)
      ignoreEnvFile: false,
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
    DashboardModule,
    DatabaseModule,
    PaginatorModule,
    FilesModule,
    EmailModule,
    AuthModule,
    UsersModule,
    SeedsModule,
    LocationsModule,
    ServicesModule,
    RequestsModule,
    ReportsModule,
    ReviewsModule,
    NationaltiesModule,
    NotificationsModule,
    PaymentModule,
    RegionsModule,
    DeviceVersionsModule,
    ChatModule,
    CouponsModule,
    FaqsModule
  ],
  controllers: [AppController],
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
  ],
})
export class AppModule {}
