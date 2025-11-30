export interface PaymentReceipt {
    receiptUrl: string;
    passcode: string;
    paymentMethod: string;
    paymentDate: string;
    bankCardNumber?: string;
}

export interface PaymentError {
    errorCode: string;
    errorTitle: string;
    errorMessage: string;
    errorTime: string;
}

export interface PaylinkGetInvoiceResponse {
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
    orderStatus: 'Pending' | 'Paid' | 'Canceled';
    url: string;
    qrUrl: string;
    checkUrl: string;
    success: boolean;
    digitalOrder: boolean;
    foreignCurrencyRate?: number;
    paymentReceipt?: PaymentReceipt;
    paymentErrors?: PaymentError[];
}
