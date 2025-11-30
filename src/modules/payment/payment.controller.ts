import { Body, Controller, Get, Headers, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { isPublic } from 'src/common/decorators/public.decorator';

@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService){}

    @Post('checkout/:offerId')
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language header',
        required: false,
        example: 'en',
    })
    async checkoutPayment(
        @CurrentUser() user:any,
        @Param('offerId') offerId: number,
        @Language() lang: LanguagesEnum
    ) {
        return this.paymentService.checkoutTabbyPayment(user.id, offerId, lang);
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
        return this.paymentService.checkoutPaylinkPayment(user.id, offerId, lang);
    }

    @Post('paylink/invoice/:transactionNo')
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
        return this.paymentService.getPaylinkInvoice(transactionNo, lang);
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
        return this.paymentService.updatePaylinkPaymentStatus(transactionNo);
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
            await this.paymentService.updatePaylinkPaymentStatus(transactionNo);
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
