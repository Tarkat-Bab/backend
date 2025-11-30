import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { RequestsModule } from '../requests/requests.module';
import { PaymentEntity } from './entities/payment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { SettingsModule } from 'src/dashboard/settings/settings.module';
import { PaymentContextService } from './strategies/payment-context.service';
import { TabbyPaymentStrategy } from './strategies/tabby-payment.strategy';
import { PaylinkPaymentStrategy } from './strategies/paylink-payment.strategy';

@Module({
    imports:[
        UsersModule, RequestsModule, SettingsModule,
        TypeOrmModule.forFeature([PaymentEntity])
    ],
    controllers: [ PaymentController ],
    providers: [ 
        PaymentService,
        PaymentContextService,
        TabbyPaymentStrategy,
        PaylinkPaymentStrategy
    ],
    exports: [ PaymentService ]
})
export class PaymentModule {}
