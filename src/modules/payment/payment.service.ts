import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaymentsEntity } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from '../users/services/users.service';
import { RequestsService } from '../requests/services/requests.service';
import { SavePaymentDto } from './dtos/save-payment.dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import axios from 'axios';
import { SettingsService } from 'src/dashboard/settings/settings.service';
import { FilterPaymentsDto } from './dtos/filter-payments.dto';
import { PaginatorService } from 'src/common/paginator/paginator.service';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(PaymentsEntity)
        private readonly paymentRepository: Repository<PaymentsEntity>,

        private readonly userService: UsersService,
        private readonly requestService: RequestsService,
        private readonly settingsService: SettingsService,
        private readonly paginationService: PaginatorService

    ) {}

    async checkoutPayment(userId: number, requestId: number, lang: LanguagesEnum) {
        const user = await this.userService.findById(userId, lang);
        const request = await this.requestService.findRequestById(requestId, lang);
        if(request.price <= 0){
            throw new BadRequestException(
                lang === LanguagesEnum.ARABIC ? "السعر غير صالح للدفع" : "Invalid price for payment"
            )
        } 

        const { platformAmount, technicianAmount, taxAmount, totalClientAmount } = await this.calculateAmounts(request.price);
        const payload = {
          payment: {
            amount: totalClientAmount,
            currency: "SAR",
            buyer: {
              name: user.username,
              phone: user.phone,
              email: user.email,
            },
          },
          lang,
          merchant_code: process.env.TABBY_MERCHANT_CODE,
          merchant_urls: {
            success: "https://your-store/success",
            cancel: "https://your-store/cancel",
            failure: "https://your-store/failure",
          },
     };

    // console.log("➡️ Checkout payload:", payload);
    try {
      const response = await axios.post(process.env.TABBY_CHECKOUT_URL, payload, {
        headers: {
          Authorization: `Bearer ${process.env.TABBY_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if(response.status !== 200){
        throw new InternalServerErrorException(
            lang === LanguagesEnum.ARABIC ? "فشل في عمليه الدفع" : "Failed to payment process"
        );
      }

      await this.createPayment(userId, requestId, {
        paymentTabbyId: response.data.payment.id,
        amount: response.data.payment.amount,
        currency: response.data.payment.currency,
        status:  response.data.payment.status,
        createdAt:  response.data.payment.created_at,
        totalClientAmount,
        platformAmount,
        technicianAmount,
        taxAmount        
      }, lang);

      return {
            paymentTabbyId: response.data.payment.id,
            url: response.data.configuration.available_products.installments[0].web_url
        };
    } catch (error: any) {
      console.error("❌ Checkout error:", error.response?.data || error.message);
      throw error;
    }
    }

    async updatePaymentStatus(webhookData: any) {
      const tabbyPaymentId = webhookData?.payment?.id;
      const newStatus = webhookData?.payment?.status;
      if (!tabbyPaymentId) return;

      const payment = await this.paymentRepository.findOne({
        where: { paymentTabbyId: tabbyPaymentId },
        relations: ['request'],
      });

      if (!payment) {
        console.warn('⚠️ Payment not found for Tabby ID:', tabbyPaymentId);
        return;
      }
      console.log(`💰 Payment ${tabbyPaymentId} updated to status: ${newStatus}`);

      payment.status = newStatus;
      await this.paymentRepository.save(payment);
    }

    /**
     * This method registers a webhook URL with Tabby to receive payment notifications.
     * It runs once during the application startup.
     * @returns The response from the Tabby API after registering the webhook.
     */
    async registerTabbyWebhook() {
      try {
        const response = await axios.post(
          `${process.env.TABBY_API_URL}/webhooks`,
          {
            url: `${process.env.BASE_URL}/payments/webhook`,
            header: {
              title: "X-Tabby-Signature",          
              value: process.env.TABBY_WEBHOOK_SECRET 
            }
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.TABBY_SECRET_KEY}`,
              "Content-Type": "application/json",
              "X-Merchant-Code": process.env.TABBY_MERCHANT_CODE
            }
          }
        );
      
        console.log("✅ Tabby webhook registered:", response.data);
        return response.data;
      } catch (error: any) {
        console.error("❌ Failed to register Tabby webhook:", error.response?.data || error.message);
        throw new InternalServerErrorException("Failed to register Tabby webhook");
      }
    }

    async createPayment(userId: number, requestId: number, paymentDto: SavePaymentDto, lang: LanguagesEnum) {
        const user = await this.userService.findById(userId, lang);
        const request = await this.requestService.findRequestById(requestId, lang);
        const paymentExists = await this.paymentRepository.findOne({ where: { request: { id: requestId } } });
        if(paymentExists){
            throw new BadRequestException(
                lang === LanguagesEnum.ARABIC ? "تم تسجيل الدفع لهذا الطلب مسبقاً" : "Payment for this request already exists"
            );
        }

        const payment = this.paymentRepository.create({
            paymentTabbyId: paymentDto.paymentTabbyId,
            amount: paymentDto.totalClientAmount,
            technicianAmount: paymentDto.technicianAmount,
            platformAmount : paymentDto.platformAmount,
            taxAmount : paymentDto.taxAmount,
            currency: paymentDto.currency,
            status: paymentDto.status,
            createdAt: new Date(paymentDto.createdAt),
            user: user,
            request: request
        });

        return this.paymentRepository.save(payment);
    }

    async listPayments(filterPaymentsDto: FilterPaymentsDto, lang: LanguagesEnum) {
      const page = filterPaymentsDto.page || 1;
      const limit = filterPaymentsDto.limit || 10;
      const skip = (page - 1) * limit;
        
      const search = filterPaymentsDto.search ? `%${filterPaymentsDto.search}%` : '%%';
        
      const query = this.paymentRepository.createQueryBuilder('payment')
        .leftJoinAndSelect('payment.user', 'user')
        .leftJoinAndSelect('payment.request', 'request')
        .leftJoinAndSelect('request.technician', 'technician')
        .where('(user.username ILIKE :search OR request.title ILIKE :search)', { search })
        .orderBy('payment.createdAt', 'DESC')
        .select([
            'payment.id', 'payment.createdAt', 'user.id', 'user.username',
            'request.id', 'request.requestNumber', 'request.title',
            'technician.id', 'technician.username',
            'payment.amount', 'payment.technicianAmount', 'payment.platformAmount', 'payment.taxAmount',
            'payment.status', 
        ])
        .skip(skip)
        .take(limit);
        
      const [payments, total] = await query.getManyAndCount();
        
      return this.paginationService.makePaginate(payments, total, limit, page);
    }

    private async calculateAmounts(requestAmount: number) {
        const { platformPercentage, taxPercentage, technicianPercentage } = await this.settingsService.getSetting();
        let platformAmount = (requestAmount * platformPercentage) / 100;
        if(platformAmount > 3) platformAmount = 3;

        const taxAmount         = (requestAmount * taxPercentage) / 100;
        const technicianAmount  = (requestAmount * technicianPercentage) / 100;
        const totalClientAmount = platformAmount + taxAmount + requestAmount;

        console.log("Request Amount:", requestAmount);
        console.log("Technician percentage:", technicianPercentage);
        console.log("Platform percentage for client:", platformPercentage);
        console.log("Technician Amount:", technicianAmount);
        console.log("Tax Amount:", taxAmount);
        console.log("Total Client Amount:", totalClientAmount);
        return {
            taxAmount,
            platformAmount,
            technicianAmount,
            totalClientAmount
        };
    }
}
