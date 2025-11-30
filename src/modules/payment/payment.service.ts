import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from '../users/services/users.service';
import { SavePaymentDto } from './dtos/save-payment.dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { FilterPaymentsDto } from './dtos/filter-payments.dto';
import { PaginatorService } from 'src/common/paginator/paginator.service';
import { RequestOffersService } from '../requests/services/requests-offers.service';
import { DashboardSettingsService } from 'src/dashboard/settings/services/settings.service';
import { PaymentContextService } from './strategies/payment-context.service';
import { TabbyPaymentStrategy } from './strategies/tabby-payment.strategy';
import { PaylinkPaymentStrategy } from './strategies/paylink-payment.strategy';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(PaymentEntity)
        private readonly paymentRepository: Repository<PaymentEntity>,

        private readonly userService: UsersService,
        private readonly requestOfferService: RequestOffersService,
        private readonly settingsService: DashboardSettingsService,
        private readonly paginationService: PaginatorService,
        private readonly paymentContext: PaymentContextService,
        private readonly tabbyStrategy: TabbyPaymentStrategy,
        private readonly paylinkStrategy: PaylinkPaymentStrategy

    ) {}

    async checkoutPayment(userId: number, offertId: number, lang: LanguagesEnum, provider: 'tabby' | 'paylink' = 'tabby') {
        const user = await this.userService.findById(userId, lang);
        const offer = await this.requestOfferService.findOne(offertId, lang)
        if(offer.price <= 0){
            throw new BadRequestException(
                lang === LanguagesEnum.ARABIC ? "السعر غير صالح للدفع" : "Invalid price for payment"
            )
        } 

        const { platformAmountFromTech, platformAmountFromClient, totalTechnicianAmount, totalClientAmount } = await this.calculateAmounts(offer.price);
        
        // Set payment strategy based on provider
        if (provider === 'paylink') {
          this.paymentContext.setStrategy(this.paylinkStrategy);
        } else {
          this.paymentContext.setStrategy(this.tabbyStrategy);
        }
        
        try {
          const result = await this.paymentContext.executeCheckout(
            totalClientAmount,
            "SAR",
            {
              name: user.username,
              phone: user.phone,
              email: user.email,
            },
            lang
          );

          await this.createPayment(
            userId,
            offer.id,
            {
              tabbyPaymentId: result.paymentId,
              currency: "SAR",
              status: "created",
              createdAt: new Date().toISOString(),
              amount: totalClientAmount,
              platformAmountFromTech,
              platformAmountFromClient,
              totalTechnicianAmount,
              taxAmount: 0       
            }, 
            lang
          );

          return {
            paymentId: result.paymentId,
            url: result.url,
            provider
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
        where: { tabbyPaymentId: tabbyPaymentId },
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
     * This method registers a webhook URL with the payment provider to receive payment notifications.
     * It runs once during the application startup.
     * @returns The response from the payment provider API after registering the webhook.
     */
    async registerTabbyWebhook() {
      this.paymentContext.setStrategy(this.tabbyStrategy);
      return this.paymentContext.registerWebhook();
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
            tabbyPaymentId: paymentDto.tabbyPaymentId,
            totalClientAmount: paymentDto.amount,
            totalTechnicianAmount: paymentDto.totalTechnicianAmount,
            platformAmountFromTech : paymentDto.platformAmountFromTech,
            platformAmountFromClient : paymentDto.platformAmountFromClient,
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
          'payment.id',
          'payment.createdAt',
          'payment.totalClientAmount',
          'payment.totalTechnicianAmount',
          'payment.platformAmountFromTech',
          'payment.taxAmount',
          'payment.status',

          'user.id',
          'user.username',
          'offer.id',

          'request.id',
          'request.requestNumber',
          'request.title',
          'request.status',

          'technician.id',
          'technician.username',
        ])
        .skip(skip)
        .take(limit);
        
      const [payments, total] = await query.getManyAndCount();
      const mappedPayments = payments.map((pay)=>{
        return{
          id: pay.id,
          username: pay.user.username,
          technicianName: pay.offer.request.technician.username,
          requestTitle: pay.offer.request.title,
          requestNumber: pay.offer.request.requestNumber,
          totalClientAmount: pay.totalClientAmount,
          totalTechnicianAmount: pay.totalTechnicianAmount,
          taxAmount: pay.taxAmount,
          platformAmountFromTech: pay.platformAmountFromTech,
          platformAmountFromClient: pay.platformAmountFromClient,
          paymentStatus: pay.status,
          requestStatus: pay.offer.request.status,
          offerId: pay.offer.id,
          requestId: pay.offer.request.id,
          }
      })
      return this.paginationService.makePaginate(mappedPayments, total, limit, page);
    }

    private async calculateAmounts(offerPrice: number) {
      let { clientPercentage, technicianPercentage, taxPercentage } = await this.settingsService.getSetting();

      offerPrice = Number(offerPrice);
      clientPercentage = Number(clientPercentage) || 3;
      technicianPercentage = Number(technicianPercentage) || 20;

      let platformAmountFromClient = (offerPrice * clientPercentage) / 100;
      let platformAmountFromTech = (offerPrice * technicianPercentage) / 100;

      if (platformAmountFromClient > 3) platformAmountFromClient = 3;

      platformAmountFromClient = Number(platformAmountFromClient.toFixed(2));
      platformAmountFromTech = Number(platformAmountFromTech.toFixed(2));

      const totalTechnicianAmount = Number((offerPrice - platformAmountFromTech).toFixed(2));
      const totalClientAmount = Number((offerPrice + platformAmountFromClient).toFixed(2));

      // console.log({
      //   offerPrice,
      //   clientPercentage,
      //   platformAmountFromClient,
      //   totalClientAmount
      // });
    
      return {
        platformAmountFromTech,
        platformAmountFromClient,
        totalTechnicianAmount,
        totalClientAmount
      };
    }

 }
