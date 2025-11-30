import { IsString, IsNumber, IsEmail } from 'class-validator';

export class PaylinkWebhookV1Dto {
    @IsNumber()
    amount: number;

    @IsEmail()
    merchantEmail: string;

    @IsString()
    transactionNo: string;

    @IsString()
    merchantOrderNumber: string;

    @IsString()
    orderStatus: string;
}
