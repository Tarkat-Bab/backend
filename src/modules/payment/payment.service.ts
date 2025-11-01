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

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(PaymentsEntity)
        private readonly paymentRepository: Repository<PaymentsEntity>,

        private readonly userService: UsersService,
        private readonly requestService: RequestsService,
        private readonly settingsService: SettingsService

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
          merchant_code: "default",
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
            url: response.data.configuration.available_products.installments[0].web_url
        };
    } catch (error: any) {
      console.error("❌ Checkout error:", error.response?.data || error.message);
      throw error;
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
