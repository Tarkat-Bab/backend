import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { RequestsModule } from '../requests/requests.module';
import { PaymentsEntity } from './entities/payment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { SettingsModule } from 'src/dashboard/settings/settings.module';

@Module({
    imports:[
        UsersModule, RequestsModule, SettingsModule,
        TypeOrmModule.forFeature([PaymentsEntity])
    ],
    controllers: [ PaymentController ],
    providers: [ PaymentService ],
    exports: [ PaymentService ]
})
export class PaymentModule {}
