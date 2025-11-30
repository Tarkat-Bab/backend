import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { CreatePaylinkInvoiceDto } from './dtos/create-paylink-invoice.dto';
import { PaylinkInvoiceResponse } from './dtos/paylink-invoice-response.dto';
import { PaylinkGetInvoiceResponse } from './dtos/paylink-get-invoice-response.dto';

@Injectable()
export class PaylinkService {
    private readonly apiUrl = process.env.PAYLINK_API_URL;
    private readonly apiId = process.env.PAYLINK_API_ID;
    private readonly secretKey = process.env.PAYLINK_SECRET_KEY;
    private token: string | null = null;
    private tokenExpiry: Date | null = null;

    /**
     * Authenticates with Paylink API and returns an access token
     * @param persistToken - When true, token is valid for 30 hours. When false, valid for 30 minutes
     * @returns The authentication token
     */
    async auth(persistToken: boolean = true): Promise<string> {
        // Return cached token if still valid
        if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.token;
        }

        try {
            const response = await axios.post(
                `${this.apiUrl}/auth`,
                {
                    apiId: this.apiId,
                    secretKey: this.secretKey,
                    persistToken: persistToken.toString()
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'accept': 'application/json'
                    }
                }
            );

            this.token = response.data.id_token;
            
            // Set token expiry based on persistToken value
            const expiryHours = persistToken ? 30 : 0.5; // 30 hours or 30 minutes
            this.tokenExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

            return this.token;
        } catch (error: any) {
            console.error('❌ Paylink authentication failed:', error.response?.data || error.message);
            throw new InternalServerErrorException('Failed to authenticate with Paylink');
        }
    }

    /**
     * Gets the authorization header with Bearer token for Paylink API requests
     * @returns Authorization header object
     */
    async getAuthHeaders(): Promise<{ Authorization: string; Accept: string; 'Content-Type': string }> {
        const token = await this.auth();
        return {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    }

    /**
     * Creates a new invoice and obtains a payment URL (Checkout)
     * @param invoiceData - The invoice data
     * @returns The invoice response with payment URL
     */
    async addInvoice(invoiceData: CreatePaylinkInvoiceDto): Promise<PaylinkInvoiceResponse> {
        try {
            const headers = await this.getAuthHeaders();
            
            const response = await axios.post(
                `${this.apiUrl}/addInvoice`,
                invoiceData,
                { headers }
            );

            if (!response.data.success) {
                throw new InternalServerErrorException(
                    response.data.paymentErrors || 'Failed to create invoice'
                );
            }

            return response.data;
        } catch (error: any) {
            console.error('❌ Paylink invoice creation failed:', error.response?.data || error.message);
            
            if (error.response?.data) {
                throw new InternalServerErrorException(
                    error.response.data.detail || error.response.data.title || 'Failed to create Paylink invoice'
                );
            }
            
            throw new InternalServerErrorException('Failed to create Paylink invoice');
        }
    }

    /**
     * Gets invoice details by transaction number from paylink
     * @param transactionNo - The transaction number from Paylink
     * @returns The invoice details including status and payment information
     */
    async getInvoice(transactionNo: string): Promise<PaylinkGetInvoiceResponse> {
        try {
            const headers = await this.getAuthHeaders();
            
            const response = await axios.get(
                `${this.apiUrl}/getInvoice/${transactionNo}`,
                { headers }
            );

            if (!response.data.success) {
                throw new NotFoundException(`Invoice with transaction number ${transactionNo} not found`);
            }

            return response.data;
        } catch (error: any) {
            console.error('❌ Paylink get invoice failed:', error.response?.data || error.message);
            
            if (error.response?.status === 404) {
                throw new NotFoundException(`Invoice with transaction number ${transactionNo} not found`);
            }
            
            if (error.response?.data) {
                throw new InternalServerErrorException(
                    error.response.data.detail || error.response.data.title || 'Failed to get Paylink invoice'
                );
            }
            
            throw new InternalServerErrorException('Failed to get Paylink invoice');
        }
    }
}