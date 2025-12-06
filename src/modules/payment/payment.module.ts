import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { RequestsModule } from '../requests/requests.module';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaylinkService } from './paylink.service';
import { SettingsModule } from 'src/dashboard/settings/settings.module';
import { PaymentStrategyFactory } from './strategies/payment-strategy.factory';
import { PaylinkStrategy } from './strategies/paylink.startgy';
import { TabbyStrategy } from './strategies/tabby.starategy';

@Module({
    imports:[
        UsersModule, RequestsModule, SettingsModule,
        TypeOrmModule.forFeature([PaymentEntity, PaymentTransactionEntity])
    ],
    controllers: [ PaymentController ],
    providers: [ 
        PaymentService, 
        PaylinkService, 
        PaymentStrategyFactory,
        PaylinkStrategy,
        TabbyStrategy
    ],
    exports: [ PaymentService, PaylinkService ]
})
export class PaymentModule {}