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
import { PaymentAnalyticsDto, PeriodEnum } from './dtos/payment-analytics.dto';
import { CouponsService } from '../coupons/coupons.service';
import { CouponEntity } from '../coupons/entities/coupons.entity';

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
        private readonly couponsService: CouponsService,

    ) {}

    private async checkFirstPay(userId: number): Promise<boolean>{
      const pay = await this.paymentRepository.findOne({
        where: { user: { id: userId }, status: 'Paid' }
      });
     
      return !pay; // Returns true if this is first payment
    }

    async checkout(userId: number, offerId: number, lang: LanguagesEnum, paymentMethod: PaymentMethodsEnum, couponId?: number) {
      const strategy = this.strategyFactory.getStrategy(paymentMethod);
      return strategy.checkout(userId, offerId, lang, couponId);
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

    async createPayment(userId: number, offerId: number, lang: LanguagesEnum, paymentMethod?: PaymentMethodsEnum, couponId?: number) {
      const user = await this.userService.findById(userId, lang);
      const offer = await this.requestOfferService.findOne(offerId, lang);

      this.checkPrice(offer.price, lang, paymentMethod);
      await this.checkPayment(offer, lang);

      const { platformAmountFromTech, platformAmountFromClient, totalTechnicianAmount, totalClientAmount } = await this.calculateAmounts(offer.price);
      
      // Check and validate coupon if provided
      let coupon: CouponEntity | null = null;
      let discountAmount = 0;
      let totalClientAmountAfterDiscount = totalClientAmount;

      if (couponId) {
        coupon = await this.validateCoupon(couponId, lang);
        discountAmount = this.calculateCouponDiscount(totalClientAmount, coupon);
        totalClientAmountAfterDiscount = Number((totalClientAmount - discountAmount).toFixed(2));
      }

      // Check if this is first payment and apply first order discount
      const isFirstPayment = await this.checkFirstPay(userId);
      if (isFirstPayment) {
        const firstOrderDiscount = await this.couponsService.getFirstOrderDiscount();
        const firstPaymentDiscount = this.calculateFirstPaymentDiscount(
          totalClientAmountAfterDiscount, 
          firstOrderDiscount.discountPercentage,
          firstOrderDiscount.maxDiscountAmount
        );
        
        // Ensure total discount doesn't exceed maxDiscountAmount from first_order_discount
        const totalDiscount = discountAmount + firstPaymentDiscount;
        const maxAllowedDiscount = Number(firstOrderDiscount.maxDiscountAmount);
        
        if (maxAllowedDiscount > 0 && totalDiscount > maxAllowedDiscount) {
          // Cap the first payment discount so total doesn't exceed max
          const adjustedFirstPaymentDiscount = maxAllowedDiscount - discountAmount;
          discountAmount = maxAllowedDiscount;
          totalClientAmountAfterDiscount = Number((totalClientAmount - discountAmount).toFixed(2));
        } else {
          discountAmount += firstPaymentDiscount;
          totalClientAmountAfterDiscount = Number((totalClientAmountAfterDiscount - firstPaymentDiscount).toFixed(2));
        }
      }

      const payment = this.paymentRepository.create({
        platformAmountFromTech, 
        platformAmountFromClient, 
        totalTechnicianAmount, 
        totalClientAmount,
        totalClientAmountAfterDiscount,
        discountAmount,
        offer,
        user,
        coupon
      });

      return await this.paymentRepository.save(payment);
    }

    private async validateCoupon(couponId: number, lang: LanguagesEnum): Promise<CouponEntity> {
      const coupon = await this.couponsService.findOne(couponId, lang);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDate = new Date(coupon.startDate);
      const endDate = new Date(coupon.endDate);
      
      if (today < startDate || today > endDate) {
        throw new BadRequestException(
          lang === LanguagesEnum.ARABIC 
            ? 'القسيمة منتهية الصلاحية أو غير صالحة' 
            : 'Coupon is expired or not valid yet'
        );
      }
      
      return coupon;
    }

    private calculateCouponDiscount(amount: number, coupon: CouponEntity): number {
      const discountPercentage = Number(coupon.discountPercentage);
      const maxDiscountAmount = Number(coupon.maxDiscountAmount);
      
      let discount = (amount * discountPercentage) / 100;
      
      if (maxDiscountAmount > 0 && discount > maxDiscountAmount) {
        discount = maxDiscountAmount;
      }
      
      return Number(discount.toFixed(2));
    }

    private calculateFirstPaymentDiscount(amount: number, discountPercentage: number, maxDiscountAmount: number): number {
      let discount = (amount * Number(discountPercentage)) / 100;
      
      if (maxDiscountAmount > 0 && discount > maxDiscountAmount) {
        discount = maxDiscountAmount;
      }
      
      return Number(discount.toFixed(2));
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
        .leftJoinAndSelect('payment.coupon', 'coupon')
        .leftJoinAndSelect('offer.request', 'request')
        .leftJoinAndSelect('request.technician', 'technician')
        .where('(user.username ILIKE :search OR request.title ILIKE :search)', { search })
        .orderBy('payment.createdAt', 'DESC')
        .select([
          'payment.id',
          'payment.createdAt',
          'payment.totalClientAmount',
          'payment.totalClientAmountAfterDiscount',
          'payment.discountAmount',
          'payment.totalTechnicianAmount',
          'payment.platformAmountFromTech',
          'payment.taxAmount',
          'payment.status',

          'user.id',
          'user.username',
          'offer.id',

          'coupon.id',
          'coupon.code',
          'coupon.discountPercentage',

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
          username: pay.user?.username || 'N/A',
          technicianName: pay.offer?.request?.technician?.username || 'N/A',
          requestTitle: pay.offer?.request?.title || 'N/A',
          requestNumber: pay.offer?.request?.requestNumber || 'N/A',
          totalClientAmount: pay.totalClientAmount,
          totalClientAmountAfterDiscount: pay.totalClientAmountAfterDiscount,
          discountAmount: pay.discountAmount,
          totalTechnicianAmount: pay.totalTechnicianAmount,
          taxAmount: pay.taxAmount,
          platformAmountFromTech: pay.platformAmountFromTech,
          platformAmountFromClient: pay.platformAmountFromClient,
          paymentStatus: pay.status,
          requestStatus: pay.offer?.request?.status || 'N/A',
          offerId: pay.offer?.id || null,
          requestId: pay.offer?.request?.id || null,
          coupon: pay.coupon ? {
            id: pay.coupon.id,
            code: pay.coupon.code,
            discountPercentage: pay.coupon.discountPercentage
          } : null
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

    /**
     * Get payment analytics including total revenue and net profit
     */
    async getPaymentAnalytics(analyticsDto: PaymentAnalyticsDto = {}, lang: LanguagesEnum) {
      const { startDate, endDate } = this.getDateRange(analyticsDto);

      const query = this.paymentRepository.createQueryBuilder('payment')
        .where('LOWER(payment.status) = LOWER(:status)', { status: 'Paid' });

      if (startDate && endDate) {
        query.andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        });
      }

      const payments = await query.getMany();

      const totalRevenue = payments.reduce((sum, payment) => 
        sum + Number(payment.totalClientAmount), 0
      );

      const totalPlatformProfit = payments.reduce((sum, payment) => 
        sum + Number(payment.platformAmountFromClient) + Number(payment.platformAmountFromTech), 0
      );

      const totalTechnicianPayouts = payments.reduce((sum, payment) => 
        sum + Number(payment.totalTechnicianAmount), 0
      );

      const totalTransactions = payments.length;

      const averageTransactionValue = totalTransactions > 0 
        ? totalRevenue / totalTransactions 
        : 0;

      return {
        period: analyticsDto.period || 'custom',
        startDate: startDate?.toISOString().split('T')[0],
        endDate: endDate?.toISOString().split('T')[0],
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalPlatformProfit: Number(totalPlatformProfit.toFixed(2)),
        totalTechnicianPayouts: Number(totalTechnicianPayouts.toFixed(2)),
        totalTransactions,
        averageTransactionValue: Number(averageTransactionValue.toFixed(2)),
        currency: 'SAR'
      };
    }

    /**
     * Get monthly analytics for the current year (for graph)
     */
    async getMonthlyAnalytics(lang: LanguagesEnum) {
      const currentYear = new Date().getFullYear();
      const startDate = new Date(currentYear, 0, 1, 0, 0, 0);
      const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

      const payments = await this.paymentRepository.createQueryBuilder('payment')
        .where('LOWER(payment.status) = LOWER(:status)', { status: 'Paid' })
        .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        })
        .getMany();

      const monthNames = lang === LanguagesEnum.ARABIC 
        ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      const monthlyData = Array.from({ length: 12 }, (_, index) => {
        const monthPayments = payments.filter(payment => {
          const paymentMonth = new Date(payment.createdAt).getMonth();
          return paymentMonth === index;
        });

        const totalRevenue = monthPayments.reduce((sum, payment) => 
          sum + Number(payment.totalClientAmount), 0
        );

        const totalProfit = monthPayments.reduce((sum, payment) => 
          sum + Number(payment.platformAmountFromClient) + Number(payment.platformAmountFromTech), 0
        );

        return {
          month: monthNames[index],
          monthNumber: index + 1,
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalProfit: Number(totalProfit.toFixed(2)),
          totalTransactions: monthPayments.length
        };
      });

      return {
        year: currentYear,
        currency: 'SAR',
        data: monthlyData
      };
    }

    private getDateRange(analyticsDto: PaymentAnalyticsDto = {}): { startDate: Date; endDate: Date } {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      if (analyticsDto.period === PeriodEnum.CUSTOM && analyticsDto.startDate && analyticsDto.endDate) {
        startDate = new Date(analyticsDto.startDate);
        endDate = new Date(analyticsDto.endDate);
        endDate.setHours(23, 59, 59);
      } else {
        switch (analyticsDto.period) {
          case PeriodEnum.TODAY:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            break;
          case PeriodEnum.WEEK:
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0);
            break;
          case PeriodEnum.MONTH:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            break;
          case PeriodEnum.YEAR:
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        }
      }

      return { startDate, endDate };
    }

 }