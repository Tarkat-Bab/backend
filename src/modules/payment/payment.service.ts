import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from '../users/services/users.service';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { FilterPaymentsDto } from './dtos/filter-payments.dto';
import { PaginatorService } from 'src/common/paginator/paginator.service';
import { RequestOffersService } from '../requests/services/requests-offers.service';
import { DashboardSettingsService } from 'src/dashboard/settings/services/settings.service';
import { PaymentMethodsEnum } from './enums/payment.enum';
import { RequestOffersEntity } from '../requests/entities/request_offers.entity';
import { PaymentStrategyFactory } from './strategies/payment-strategy.factory';
import { PaylinkService } from './paylink.service';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(PaymentEntity)
        private readonly paymentRepository: Repository<PaymentEntity>,
        @InjectRepository(PaymentTransactionEntity)
        private readonly paylinkTransactionRepository: Repository<PaymentTransactionEntity>,
        private readonly userService: UsersService,
        private readonly requestOfferService: RequestOffersService,
        private readonly settingsService: DashboardSettingsService,
        private readonly paginationService: PaginatorService,
        private readonly strategyFactory: PaymentStrategyFactory,
        private readonly paylinkService: PaylinkService,

    ) {}

    async checkout(userId: number, offerId: number, lang: LanguagesEnum, paymentMethod: PaymentMethodsEnum) {
      const strategy = this.strategyFactory.getStrategy(paymentMethod);
      return strategy.checkout(userId, offerId, lang);
    }

    async getPaylingInvoice(orderNumber: string, transactionNo: string){
      return await this.paylinkService.getInvoice(transactionNo);
    }
    /**
     * Update payment status from webhook data (Tabby format)
     */
    async updatePaymentStatus(webhookDataOrTransactionNo: any) {
      console.log("Webhook Data: ", webhookDataOrTransactionNo)
      // Handle Tabby webhook format
      if (typeof webhookDataOrTransactionNo === 'object') {
        const transactionNumber = webhookDataOrTransactionNo?.payment?.id;
        const newStatus = webhookDataOrTransactionNo?.payment?.status;
        if (!transactionNumber) return;

        const payment = await this.paymentRepository.findOne({
          where: { transactionNumber: transactionNumber },
          relations: ['user', 'offer'],
        });

        if (!payment) {
          return;
        }

        payment.status = newStatus;
        await this.paymentRepository.save(payment);

        if(newStatus === 'authorized' || newStatus === 'Paid'){
          await this.requestOfferService.acceptOffer(payment.user.id, payment.offer.id)
        }
        return payment;
      }
      
      // Handle Paylink transaction number format
      // const transactionNo = webhookDataOrTransactionNo;
      // const invoiceDetails = await this.paylinkService.getInvoice(transactionNo);
      
      const payment = await this.paymentRepository.findOne({
          where: { transactionNumber: webhookDataOrTransactionNo.transactionNo },
          relations: ['user', 'offer']
      });

      if (!payment) {
          console.log(`⚠️ Payment not found for transaction: ${webhookDataOrTransactionNo.transactionNo}`);
          return;
      }

      const oldStatus = payment.status;
      payment.status = webhookDataOrTransactionNo.orderStatus;
      await this.paymentRepository.save(payment);

      // Update Paylink transaction status
      await this.updatePaylinkTransaction(
        webhookDataOrTransactionNo.transactionNo, 
        webhookDataOrTransactionNo.orderStatus
      );

      console.log(`✅ Payment status updated: ${oldStatus} -> ${webhookDataOrTransactionNo.orderStatus}`);

      if (webhookDataOrTransactionNo.orderStatus === 'Paid' && oldStatus !== 'Paid') {
          await this.requestOfferService.acceptOffer(payment.user.id, payment.offer.id);
          console.log(`✅ Offer #${payment.offer.id} accepted after payment`);
      }

      return payment;
    }

    async remove(paymentId:number){
      return await this.paymentRepository.delete({id: paymentId} );
    }

    async createPayment(userId: number, offerId: number, lang: LanguagesEnum, paymentMethod?: PaymentMethodsEnum) {
      const user = await this.userService.findById(userId, lang);
      const offer = await this.requestOfferService.findOne(offerId, lang);

      this.checkPrice(offer.price, lang, paymentMethod);
      await this.checkPayment(offer, lang);

      const { platformAmountFromTech, platformAmountFromClient, totalTechnicianAmount, totalClientAmount } = await this.calculateAmounts(offer.price);
      const payment = this.paymentRepository.create({
        platformAmountFromTech, platformAmountFromClient, totalTechnicianAmount, totalClientAmount,
        offer,
        user
      });

      return await this.paymentRepository.save(payment);
    }

    async updatePaymentInfo(paymentId: number, transactionNumber: string, status: string){
      return await this.paymentRepository.update(paymentId, {transactionNumber, status })
    }

    async savePaylinkTransaction(
      paymentId: number, 
      transactionNo: string, 
      merchantOrderNumber: string, 
      amount: number, 
      orderStatus: string,
      merchantEmail?: string
    ) {
      const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
      
      if (!payment) {
        throw new BadRequestException('Payment not found');
      }

      const paylinkTransaction = this.paylinkTransactionRepository.create({
        amount,
        merchantEmail,
        transactionNo,
        merchantOrderNumber,
        orderStatus,
        payment
      });

      return await this.paylinkTransactionRepository.save(paylinkTransaction);
    }

    async updatePaylinkTransaction(transactionNo: string, orderStatus: string) {
      return await this.paylinkTransactionRepository.update(
        { transactionNo }, 
        { orderStatus }
      );
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

    private async checkPayment(offer: RequestOffersEntity, lang: LanguagesEnum){
      const existingPayment = await this.paymentRepository.findOne({ 
            where: { offer: { id: offer.id } },
            relations: ['offer']
        });

      if (existingPayment) {
        // if (existingPayment.status === 'Paid') {
          throw new BadRequestException(
            lang === LanguagesEnum.ARABIC 
              ? "تم الدفع لهذا العرض مسبقاً" 
              : "This offer has already been paid"
            );
          }
      // }
      // return existingPayment;
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
    
      return {
        platformAmountFromTech,
        platformAmountFromClient,
        totalTechnicianAmount,
        totalClientAmount
      };
    }

    private checkPrice(price:number,lang: LanguagesEnum,  paymentMethod?: PaymentMethodsEnum): void{
      if(price <= 0){
        throw new BadRequestException(
            lang === LanguagesEnum.ARABIC ? "السعر غير صالح للدفع" : "Invalid price for payment"
        )
      } 
      if (price < 5 && paymentMethod == PaymentMethodsEnum.PAYLINK) {
        throw new BadRequestException(
          lang === LanguagesEnum.ARABIC 
            ? "الحد الأدنى للمبلغ هو 5 ريال سعودي" 
            : "Minimum amount is SAR 5.00"
        );
      }
      return;
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

        return this.updatePaymentStatus(transactionNo);
    }

 }