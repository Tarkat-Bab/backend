import { Body, Controller, Get, Headers, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
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
    async checkoutTabbyPayment(
        @CurrentUser() user:any,
        @Param('offerId') offerId: number,
        @Language() lang: LanguagesEnum
    ) {
        const strategy = this.paymentStrategyFactory.getStrategy(PaymentMethodsEnum.TABBY);
        return strategy.checkout(user.id, offerId, lang);
    }

    @Post('paylink/checkout/:offerId')
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language header',
        required: false,
        example: 'en',
    })
    async checkoutPaylinkPayment(
        @CurrentUser() user:any,
        @Param('offerId') offerId: number,
        @Language() lang: LanguagesEnum
    ) {
        const strategy = this.paymentStrategyFactory.getStrategy(PaymentMethodsEnum.PAYLINK);
        return strategy.checkout(user.id, offerId, lang);
    }

    @Get('paylink/invoice/:transactionNo')
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language header',
        required: false,
        example: 'en',
    })
    async getPaylinkInvoice(
        @Param('transactionNo') transactionNo: string,
        @Language() lang: LanguagesEnum
    ) {
        return this.paylinkService.getInvoice(transactionNo);
    }

    @Post('paylink/verify/:transactionNo')
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language header',
        required: false,
        example: 'en',
    })
    async verifyPaylinkPayment(
        @Param('transactionNo') transactionNo: string
    ) {
        return this.paymentService.updatePaymentStatus(transactionNo);
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
    @Post('paylink/webhook')
    async handlePaylinkWebhook(
        @Headers() headers: any,
        @Body() body: any
    ){
        console.log('✅ Paylink webhook received:', body);
        console.log('📋 Headers:', headers);

        await this.paymentService.handlePaylinkWebhook(body);
        return { status: 'ok' };
    }

    @isPublic()
    @Get('paylink/callback')
    async handlePaylinkCallback(
        @Query('transactionNo') transactionNo: string
    ){
        console.log('✅ Paylink callback received for transaction:', transactionNo);
        
        if (transactionNo) {
            await this.paymentService.updatePaymentStatus(transactionNo);
        }

        return {
            success: true,
            message: 'Payment processed successfully',
            transactionNo
        };
    }

    @isPublic()
    @Get('paylink/cancel')
    async handlePaylinkCancel(
        @Query('transactionNo') transactionNo: string
    ){
        console.log('⚠️ Paylink payment cancelled for transaction:', transactionNo);
        
        return {
            success: false,
            message: 'Payment was cancelled',
            transactionNo
        };
    }
}
