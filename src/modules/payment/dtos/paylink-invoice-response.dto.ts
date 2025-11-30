export interface PaylinkInvoiceResponse {
    gatewayOrderRequest: {
        amount: number;
        orderNumber: string;
        callBackUrl: string;
        clientEmail?: string;
        clientName: string;
        clientMobile: string;
        note?: string;
        cancelUrl?: string;
        products: any[];
        supportedCardBrands?: string[];
        currency: string;
        smsMessage?: string;
        displayPending?: boolean;
        receivers?: any;
        partnerPortion?: any;
        metadata?: any;
    };
    amount: number;
    transactionNo: string;
    orderStatus: string;
    paymentErrors?: string;
    url: string;
    qrUrl: string;
    mobileUrl: string;
    checkUrl: string;
    success: boolean;
    digitalOrder: boolean;
    foreignCurrencyRate?: number;
    paymentReceipt?: any;
    metadata?: any;
}
