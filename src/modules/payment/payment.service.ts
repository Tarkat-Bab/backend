import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from '../users/services/users.service';
import { SavePaymentDto } from './dtos/save-payment.dto';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import axios from 'axios';
import { FilterPaymentsDto } from './dtos/filter-payments.dto';
import { PaginatorService } from 'src/common/paginator/paginator.service';
import { RequestOffersService } from '../requests/services/requests-offers.service';
import { DashboardSettingsService } from 'src/dashboard/settings/services/settings.service';
import { PaylinkService } from './paylink.service';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(PaymentEntity)
        private readonly paymentRepository: Repository<PaymentEntity>,

        private readonly userService: UsersService,
        private readonly requestOfferService: RequestOffersService,
        private readonly settingsService: DashboardSettingsService,
        private readonly paginationService: PaginatorService,
        private readonly paylinkService: PaylinkService

    ) {}

    async checkoutTabbyPayment(userId: number, offertId: number, lang: LanguagesEnum) {
        const user = await this.userService.findById(userId, lang);
        const offer = await this.requestOfferService.findOne(offertId, lang)
        if(offer.price <= 0){
            throw new BadRequestException(
                lang === LanguagesEnum.ARABIC ? "السعر غير صالح للدفع" : "Invalid price for payment"
            )
        } 

        // Check if payment already exists for this offer
        const existingPayment = await this.paymentRepository.findOne({ 
            where: { offer: { id: offer.id } },
            relations: ['offer']
        });

        if (existingPayment) {
            // If payment exists and is already authorized/paid, throw error
            if (existingPayment.status === 'authorized' || existingPayment.status === 'closed') {
                throw new BadRequestException(
                    lang === LanguagesEnum.ARABIC 
                        ? "تم الدفع لهذا العرض مسبقاً" 
                        : "This offer has already been paid"
                );
            }

            // If payment exists but not completed, return existing payment info
            // Note: We can't retrieve the Tabby URL again, so return the payment ID
            return {
                tabbyPaymentId: existingPayment.tabbyPaymentId,
                url: null,
                message: lang === LanguagesEnum.ARABIC 
                    ? "يوجد دفع معلق لهذا العرض" 
                    : "A pending payment exists for this offer"
            };
        }

        const { platformAmountFromTech, platformAmountFromClient, totalTechnicianAmount, totalClientAmount } = await this.calculateAmounts(offer.price);
        const payload = {
          payment: {
            amount: totalClientAmount.toString(),
            currency: "SAR",
            buyer: {
              name: user.username,
              phone: user.phone,
              email: user.email,
            },
          },
          lang,
          merchant_code: process.env.TABBY_MERCHANT_CODE
      }
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
        tabbyPaymentId: response.data.payment.id,
        currency: response.data.payment.currency,
        status:  response.data.payment.status,
        createdAt:  response.data.payment.created_at,
        amount: totalClientAmount,
        platformAmountFromTech,
        platformAmountFromClient,
        totalTechnicianAmount,
        taxAmount :0       
      }, lang);

      return {
          tabbyPaymentId: response.data.payment.id,
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

        // const paymentExists = await this.paymentRepository.findOne({ where: { offer: { id: offer.id } } });
        // if(paymentExists){
        //     throw new BadRequestException(
        //         lang === LanguagesEnum.ARABIC ? "تم تسجيل الدفع لهذا العرض مسبقاً" : "Payment for this offer already exists"
        //     );
        // }

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

    /**
     * Checkout payment using Paylink gateway
     */
    async checkoutPaylinkPayment(userId: number, offerId: number, lang: LanguagesEnum) {
        const user = await this.userService.findById(userId, lang);
        const offer = await this.requestOfferService.findOne(offerId, lang);
        
        if (offer.price < 5) {
            throw new BadRequestException(
                lang === LanguagesEnum.ARABIC 
                    ? "الحد الأدنى للمبلغ هو 5 ريال سعودي" 
                    : "Minimum amount is SAR 5.00"
            );
        }

        // Check if payment already exists for this offer
        const existingPayment = await this.paymentRepository.findOne({ 
            where: { offer: { id: offer.id } },
            relations: ['offer']
        });

        if (existingPayment) {
            // If payment exists and is already paid, throw error
            if (existingPayment.status === 'Paid') {
                throw new BadRequestException(
                    lang === LanguagesEnum.ARABIC 
                        ? "تم الدفع لهذا العرض مسبقاً" 
                        : "This offer has already been paid"
                );
            }

            // If payment exists but not paid, get the invoice details and return
            const invoiceDetails = await this.paylinkService.getInvoice(existingPayment.tabbyPaymentId);
            
            return {
                transactionNo: invoiceDetails.transactionNo,
                orderStatus: invoiceDetails.orderStatus,
                url: invoiceDetails.url,
                qrUrl: invoiceDetails.qrUrl
            };
        }

        const { platformAmountFromTech, platformAmountFromClient, totalTechnicianAmount, totalClientAmount } = 
            await this.calculateAmounts(offer.price);

        const orderNumber = `ORDER-${Date.now()}-${offerId}`;
        
        const invoiceData = {
            orderNumber,
            amount: totalClientAmount,
            callBackUrl: `${process.env.BASE_URL}/payments/paylink/callback`,
            cancelUrl: `${process.env.BASE_URL}/payments/paylink/cancel`,
            clientName: user.username,
            clientEmail: user.email,
            clientMobile: user.phone,
            currency: 'SAR',
            products: [
                {
                    title: offer.request?.title || 'Service Payment',
                    price: offer.price,
                    qty: 1,
                    description: `Payment for offer #${offerId}`
                }
            ],
            displayPending: true,
            note: `Payment for offer #${offerId}`
        };

        const response = await this.paylinkService.addInvoice(invoiceData);

        await this.createPayment(
            userId,
            offer.id,
            {
                tabbyPaymentId: response.transactionNo,
                currency: 'SAR',
                status: response.orderStatus,
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
            transactionNo: response.transactionNo,
            orderStatus: response.orderStatus,
            url: response.url,
            qrUrl: response.qrUrl,
            mobileUrl: response.mobileUrl
        };
    }

    /**
     * Get Paylink invoice details by transaction number
     */
    async getPaylinkInvoice(transactionNo: string, lang: LanguagesEnum) {
        const invoiceDetails = await this.paylinkService.getInvoice(transactionNo);
        
        return {
            transactionNo: invoiceDetails.transactionNo,
            orderStatus: invoiceDetails.orderStatus,
            amount: invoiceDetails.amount,
            url: invoiceDetails.url,
            qrUrl: invoiceDetails.qrUrl,
            paymentReceipt: invoiceDetails.paymentReceipt,
            paymentErrors: invoiceDetails.paymentErrors,
            digitalOrder: invoiceDetails.digitalOrder,
            gatewayOrderRequest: invoiceDetails.gatewayOrderRequest
        };
    }

    /**
     * Update payment status from Paylink webhook or manual check
     */
    async updatePaylinkPaymentStatus(transactionNo: string) {
        const invoiceDetails = await this.paylinkService.getInvoice(transactionNo);
        
        const payment = await this.paymentRepository.findOne({
            where: { tabbyPaymentId: transactionNo },
            relations: ['user', 'offer']
        });

        if (!payment) {
            console.log(`⚠️ Payment not found for transaction: ${transactionNo}`);
            return;
        }

        const oldStatus = payment.status;
        payment.status = invoiceDetails.orderStatus;
        await this.paymentRepository.save(payment);

        console.log(`✅ Payment status updated: ${oldStatus} -> ${invoiceDetails.orderStatus}`);

        // If payment is completed, accept the offer
        if (invoiceDetails.orderStatus === 'Paid' && oldStatus !== 'Paid') {
            await this.requestOfferService.acceptOffer(payment.user.id, payment.offer.id);
            console.log(`✅ Offer #${payment.offer.id} accepted after payment`);
        }

        return payment;
    }

    /**
     * Handle Paylink webhook notification (supports both v1 and v2)
     * This method is called when Paylink sends a webhook notification about a paid order
     */
    async handlePaylinkWebhook(webhookData: any) {
        const transactionNo = webhookData.transactionNo;
        const orderStatus = webhookData.orderStatus;
        const apiVersion = webhookData.apiVersion || 'v1';

        console.log(`✅ Paylink webhook received (${apiVersion}):`, {
            transactionNo,
            orderStatus,
            amount: webhookData.amount,
            paymentType: webhookData.paymentType || 'N/A'
        });

        if (!transactionNo) {
            console.error('❌ Webhook missing transactionNo');
            return;
        }

        const payment = await this.paymentRepository.findOne({
            where: { tabbyPaymentId: transactionNo },
            relations: ['user', 'offer']
        });

        if (!payment) {
            console.log(`⚠️ Payment not found for transaction: ${transactionNo}`);
            return;
        }

        const oldStatus = payment.status;
        payment.status = orderStatus;
        await this.paymentRepository.save(payment);

        console.log(`✅ Payment status updated via webhook: ${oldStatus} -> ${orderStatus}`);

        // If payment is completed, accept the offer
        if (orderStatus === 'Paid' && oldStatus !== 'Paid') {
            await this.requestOfferService.acceptOffer(payment.user.id, payment.offer.id);
            console.log(`✅ Offer #${payment.offer.id} accepted after payment`);
        }

        return payment;
    }

 }