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
import { RequestOffersService } from '../requests/services/requests-offers.service';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(PaymentsEntity)
        private readonly paymentRepository: Repository<PaymentsEntity>,

        private readonly userService: UsersService,
        private readonly requestOfferService: RequestOffersService,
        private readonly settingsService: SettingsService,
        private readonly paginationService: PaginatorService

    ) {}

    async checkoutPayment(userId: number, offertId: number, lang: LanguagesEnum) {
        const user = await this.userService.findById(userId, lang);
        const offer = await this.requestOfferService.findOne(offertId, lang)
        if(offer.price <= 0){
            throw new BadRequestException(
                lang === LanguagesEnum.ARABIC ? "السعر غير صالح للدفع" : "Invalid price for payment"
            )
        } 

        const { platformAmount, technicianAmount, totalClientAmount } = await this.calculateAmounts(offer.price);
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

      await this.createPayment(
        userId,
        offer.id,
        {
        paymentTabbyId: response.data.payment.id,
        amount: response.data.payment.amount,
        currency: response.data.payment.currency,
        status:  response.data.payment.status,
        createdAt:  response.data.payment.created_at,
        totalClientAmount,
        platformAmount,
        technicianAmount,
        taxAmount :0       
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
        return;
      }

      payment.status = newStatus;
      await this.paymentRepository.save(payment);

      if(newStatus === 'authorized'){
        await this.requestOfferService.acceptOffer(payment.user.id, payment.offer.id)
      }
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

    async createPayment(userId: number, offerId: number, paymentDto: SavePaymentDto, lang: LanguagesEnum) {
        const user = await this.userService.findById(userId, lang);
        const offer = await this.requestOfferService.findOne(offerId, lang);

        const paymentExists = await this.paymentRepository.findOne({ where: { offer: { id: offer.id } } });
        if(paymentExists){
            throw new BadRequestException(
                lang === LanguagesEnum.ARABIC ? "تم تسجيل الدفع لهذا العرض مسبقاً" : "Payment for this offer already exists"
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
            offer,
            user
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
        .leftJoinAndSelect('payment.offer', 'offer')
        .leftJoinAndSelect('offer.request', 'request')
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

    // private async calculateAmounts(offerPrice: number) {
    //     const { platformPercentage, taxPercentage, technicianPercentage } = await this.settingsService.getSetting();
    //     let platformAmount = (offerPrice * platformPercentage) / 100;
    //     if(platformAmount > 3) platformAmount = 3;

    //     const taxAmount         = (offerPrice * taxPercentage) / 100;
    //     const technicianAmount  = (offerPrice * technicianPercentage) / 100;
    //     const totalClientAmount = platformAmount + taxAmount + offerPrice;

    //     console.log("Request Amount:", offerPrice);
    //     console.log("Technician percentage:", technicianPercentage);
    //     console.log("Platform percentage for client:", platformPercentage);
    //     console.log("Technician Amount:", technicianAmount);
    //     console.log("Tax Amount:", taxAmount);
    //     console.log("Total Client Amount:", totalClientAmount);
    //     return {
    //         taxAmount,
    //         platformAmount,
    //         technicianAmount,
    //         totalClientAmount
    //     };
    // }

    private async calculateAmounts(offerPrice: number) {
        const { platformPercentage, taxPercentage, technicianPercentage } = await this.settingsService.getSetting();

      let platformAmount = (offerPrice * platformPercentage) / 100;

      if (platformAmount > 3) platformAmount = 3;

      const technicianAmount = offerPrice - (offerPrice * technicianPercentage) / 100;
      const totalClientAmount = offerPrice + platformAmount;

      console.log("Technician Amount:", technicianAmount);
      console.log("Total Client Amount:", totalClientAmount);

      return {
        technicianAmount,
        platformAmount,
        totalClientAmount
      };
  }   
}
