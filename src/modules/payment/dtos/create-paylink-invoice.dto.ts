class PaylinkProductDto {
    price: number;
}

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
}
