import { Controller, Param, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Language } from 'src/common/decorators/languages-headers.decorator';
import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('Payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService){}

    @Post('checkout/:requestId')
    @ApiHeader({
        name: 'Accept-Language',
        description: 'Language header',
        required: false,
        example: 'en',
    })
    async checkoutPayment(
        @CurrentUser() user:any,
        @Param('requestId') requestId: number,
        @Language() lang: LanguagesEnum
    ) {
        return this.paymentService.checkoutPayment(user.id, requestId, lang);
    }
}
