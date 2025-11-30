import { PaylinkProductDto } from './paylink-product.dto';

export class CreatePaylinkInvoiceDto {
    orderNumber: string;
    amount: number;
    callBackUrl: string;
    cancelUrl?: string;
    clientName: string;
    clientEmail?: string;
    clientMobile: string;
    currency?: string;
    products: PaylinkProductDto[];
    // smsMessage?: string;
    // supportedCardBrands?: string[];
    // displayPending?: boolean;
    // note?: string;
}
