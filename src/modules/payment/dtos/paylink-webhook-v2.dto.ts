import { IsString, IsNumber, IsEmail } from 'class-validator';

export class PaylinkWebhookV2Dto {
    @IsNumber()
    amount: number;

    @IsEmail()
    merchantEmail: string;

    @IsString()
    merchantMobile: string;

    @IsString()
    merchantAccountNo: string;

    @IsString()
    merchantLicenseType: string;

    @IsString()
    merchantLicenseNo: string;

    @IsString()
    transactionNo: string;

    @IsString()
    merchantOrderNumber: string;

    @IsString()
    orderStatus: string;

    @IsString()
    paymentType: 'mada' | 'visa' | 'mastercard' | 'stcpay' | 'tabby' | 'tamara' | 'urpay' | 'a2a' | 'amex' | 'sadad';

    @IsString()
    apiVersion: string;
}
