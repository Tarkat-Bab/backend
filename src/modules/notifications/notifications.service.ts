import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotificationsEntity } from './entities/notification.entity';
import { UsersNotifications } from './entities/usersNotifications.entity';
import { UsersService } from '../users/services/users.service';
import { admin } from './utilies/firebase.config';
import { sendNotificationDto } from './dtos/send-notification.dto';
import { NotificationTemplates } from './utilies/notification-templates';
import { ReceiverTypes } from './enums/receiverTypes.enum';
import { LanguagesEnum } from 'src/common/enums/lang.enum';
import { UsersTypes } from 'src/common/enums/users.enum';
import { PaginatorInput } from 'src/common/paginator/types/paginate.input';
import { PaginatorService } from 'src/common/paginator/paginator.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationsEntity)
    private readonly notificationRepo: Repository<NotificationsEntity>,

    @InjectRepository(UsersNotifications)
    private readonly usersNotificationsRepo: Repository<UsersNotifications>,

    private readonly usersService: UsersService,
    private readonly paginatorService: PaginatorService,
  ) {}

  /** Send manual notification or from template */
  async sendNotification(
    dto?: sendNotificationDto,
    receiverIds?: number[],
    templateKey?: keyof typeof NotificationTemplates,
    templateData?: Record<string, any>,
    lang: LanguagesEnum = LanguagesEnum.ENGLISH,
  ) {
    const content = this.prepareNotificationContent(dto, templateKey, templateData);
    const finalReceiverIds = await this.resolveReceiverIds(dto?.receiversType, receiverIds);

    if (!finalReceiverIds.length) {
      return { success: false, message: 'No receivers found' };
    }

    const savedNotification = await this.createNotification(content, finalReceiverIds);
    const localized = this.localizeContent(content, lang);

    const fcmResult = await this.sendFcm(finalReceiverIds,  {
        ...localized,
      data: templateData || {},
    }
  );

    return { success: true, savedNotification, fcmResult, receiversCount: finalReceiverIds.length };
  }

  /** Send automatic system notification */
  async autoNotification(
    receiverId: number,
    templateKey: keyof typeof NotificationTemplates,
    templateData: Record<string, any>,
    lang: LanguagesEnum = LanguagesEnum.ENGLISH,
  ) {
    const content = this.prepareNotificationContent(null, templateKey, templateData);
    const savedNotification = await this.createNotification(content, [receiverId]);
    const localized = this.localizeContent(content, lang);

    await this.sendFcm([receiverId], {
      ...localized,
      data: templateData || {}
    });
    return { success: true, savedNotification };
  }

  /** Create notification + user relations */
  private async createNotification(
    dto: Partial<sendNotificationDto>,
    receiverIds: number[],
  ) {
    const notification = this.notificationRepo.create(dto);
    const savedNotification = await this.notificationRepo.save(notification);

    const userNotifications = receiverIds.map((userId) =>
      this.usersNotificationsRepo.create({
        receiver: { id: userId },
        notification: savedNotification,
      }),
    );

    await this.usersNotificationsRepo.save(userNotifications);
    return savedNotification;
  }

  /** Get user notifications paginated */
  async getUserNotifications(
    userId: number,
    filter: PaginatorInput,
    lang: LanguagesEnum,
  ) {
    const { page = 1, limit: take = 20 } = filter;
    const skip = (page - 1) * take;

    const [notifications, total] = await this.notificationRepo
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.userNotifications', 'userNotification')
      .leftJoinAndSelect('userNotification.receiver', 'receiver')
      .where('receiver.id = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .take(take)
      .skip(skip)
      .getManyAndCount();

    const mapped = notifications.map((n) => {
      const userNotif = n.userNotifications.find((un) => un.receiver.id === userId);
      return {
        id: n.id,
        title: lang === LanguagesEnum.ARABIC ? n.arTitle : n.enTitle,
        body: lang === LanguagesEnum.ARABIC ? n.arBody : n.enBody,
        createdAt: n.createdAt,
        isRead: userNotif?.isRead ?? false,
      };
    });

    return this.paginatorService.makePaginate(mapped, total, take, page);
  }

  /** Mark a notification as read */
  async markAsRead(id: number, userId: number, lang: LanguagesEnum) {
    const userNotification = await this.usersNotificationsRepo.findOne({
      where: { receiver: { id: userId }, notification: { id } },
    });

    if (!userNotification) {
      throw new NotFoundException(
        lang === LanguagesEnum.ARABIC
          ? 'هذه الرسالة غير موجودة'
          : 'This notification was not found.',
      );
    }

    userNotification.isRead = true;
    return this.usersNotificationsRepo.save(userNotification);
  }

  /** Template & custom content handler */
  private prepareNotificationContent(
    dto?: sendNotificationDto | null,
    templateKey?: keyof typeof NotificationTemplates,
    templateData: Record<string, any> = {},
  ) {
    if (templateKey && NotificationTemplates[templateKey]) {
      const t = NotificationTemplates[templateKey];
      return {
        arTitle: this.replaceTemplate(t.arTitle, templateData),
        enTitle: this.replaceTemplate(t.enTitle, templateData),
        arBody: this.replaceTemplate(t.arBody, templateData),
        enBody: this.replaceTemplate(t.enBody, templateData),
      };
    }

    return {
      arTitle: dto?.arTitle ?? '',
      enTitle: dto?.enTitle ?? '',
      arBody: dto?.arBody ?? '',
      enBody: dto?.enBody ?? '',
    };
  }

  /** Language selector helper */
  private localizeContent(content, lang: LanguagesEnum) {
    return {
      title: lang === LanguagesEnum.ARABIC ? content.arTitle : content.enTitle,
      body: lang === LanguagesEnum.ARABIC ? content.arBody : content.enBody,
    };
  }

  /** Resolve final list of receivers */
  private async resolveReceiverIds(
    receiverType?: ReceiverTypes,
    receiverIds?: number[],
  ): Promise<number[]> {
    if (receiverType === ReceiverTypes.INDIVIDUAL && receiverIds?.length) return receiverIds;

    let userType: UsersTypes | null = null;
    if (receiverType === ReceiverTypes.ALL_CLIENTS) userType = UsersTypes.USER;
    else if (receiverType === ReceiverTypes.ALL_TECHNICIAN) userType = UsersTypes.TECHNICAL;

    const users = await this.usersService.findAllIds(userType);
    return users.map((u) => u.id);
  }

  /** 📱 Send notification to FCM */
  private async sendFcm(
    userIds: number[],
    { title, body, data }: { title: string; body: string,  data: Record<string, any> },
  ) {
    const tokens = await this.usersService.getFcmTokensByUserIds(userIds);
    if (!tokens.length) {
      console.warn('⚠️ No FCM tokens found for given users');
      return { sent: 0, failed: userIds.length };
    }

    try {
      const response = await admin.messaging().sendEachForMulticast({
        notification: { title, body },
        data,
        tokens: tokens.map((t) => t.fcm_token),
      });

      console.log(`✅ Sent ${response.successCount} | ❌ Failed ${response.failureCount}`);
      return response;
    } catch (error) {
      console.error('❌ FCM send error:', error);
      return { error };
    }
  }

  /** 🪄 Replace template placeholders */
  private replaceTemplate(text: string, data: Record<string, any> = {}): string {
    return text.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] || '');
  }
}
