import { Body, Controller, Get, Headers, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { ApiBearerAuth, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { isPublic } from 'src/common/decorators/public.decorator';
import { PaymentStrategyFactory } from './strategies/payment-strategy.factory';
import { PaymentMethodsEnum } from './enums/payment.enum';
import { PaylinkService } from './paylink.service';

@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly paymentStrategyFactory: PaymentStrategyFactory,
        private readonly paylinkService: PaylinkService,
    ){}

    @Post('checkout/:offerId')
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language header',
        required: false,
        example: 'en',
    })
    @ApiQuery({name: 'paymentMethod', required: true, enum: PaymentMethodsEnum, example: PaymentMethodsEnum.PAYLINK})
    async checkoutPayment(
        @CurrentUser() user:any,
        @Param('offerId') offerId: number,
        @Query('paymentMethod') paymentMethod: PaymentMethodsEnum,
        @Language() lang: LanguagesEnum
    ) {
        const strategy = this.paymentStrategyFactory.getStrategy(paymentMethod);
        return strategy.checkout(user.id, offerId, lang);
    }


    @isPublic()
    @Get('paylink')
    async invoice(
        @Query('orderNumber') orderNumber: string,
        @Query('transactionNo') transactionNo: string
    ){
        return await this.paymentService.getPaylingInvoice(orderNumber, transactionNo)
    }


    @Post('webhook')
    async handleTabbyWebhook(
        @Headers('X-Tabby-Signature') signature: string,
        @Body() body: any
    ){
        if (signature !== process.env.TABBY_WEBHOOK_SECRET) {
          throw new UnauthorizedException('Invalid signature');
        }
        console.log('✅ Webhook received from Tabby:', body);

        await this.paymentService.updatePaymentStatus(body);
        return { status: 'ok' };
    }

    @isPublic()
    @Post('/paylink/webhook')
    async paylinkWebhook(
        @Body() body: any
    ){
        return await this.paymentService.updatePaymentStatus(body);
    }
}
