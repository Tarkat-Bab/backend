import { Injectable } from '@nestjs/common';
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
import { title } from 'process';
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

  async sendNotification(
    dto: sendNotificationDto,
    receiverIds?: number[],
    templateKey?: keyof typeof NotificationTemplates,
    templateData?: Record<string, any>,
    lang: LanguagesEnum = LanguagesEnum.ENGLISH,
  ) {
    const { arTitle, enTitle, arBody, enBody } = this.prepareNotificationContent(dto, templateKey, templateData);

    const finalReceiverIds = await this.resolveReceiverIds(dto.receiversType, receiverIds);

    if (!finalReceiverIds.length) {
      return { success: false, message: 'No receivers found' };
    }

    const notification = this.notificationRepo.create({
      arTitle,
      enTitle,
      arBody,
      enBody,
      receiverTypes: dto.receiversType || ReceiverTypes.INDIVIDUAL,
    });

    const savedNotification = await this.notificationRepo.save(notification);

    const userNotifications = finalReceiverIds.map((userId) =>
      this.usersNotificationsRepo.create({
        receiver: { id: userId },
        notification: savedNotification,
        isRead: false,
      }),
    );

    await this.usersNotificationsRepo.save(userNotifications);

    const title = lang === LanguagesEnum.ARABIC ? arTitle : enTitle;
    const body = lang === LanguagesEnum.ARABIC ? arBody : enBody;
    const fcmResult = await this.sendFcm(finalReceiverIds, { title, body });

    return {
      success: true,
      savedNotification,
      fcmResult,
      receiversCount: finalReceiverIds.length,
    };
  }

  async getUserNotifications(
	  userId: number,
	  filter: PaginatorInput,
	  lang: LanguagesEnum,
	) {
	  const page = filter.page || 1;
	  const take = filter.limit || 20;
	  const skip = (page - 1) * take;

	  const query = this.notificationRepo
	    .createQueryBuilder('notification')
	    .leftJoinAndSelect('notification.userNotifications', 'userNotification')
	    .leftJoinAndSelect('userNotification.receiver', 'receiver')
	    .where('receiver.id = :userId', { userId })
	    .orderBy('notification.createdAt', 'DESC')
	    .take(take)
	    .skip(skip);

	  const [notifications, total] = await query.getManyAndCount();

	  const mappedNotifications = notifications.map((n) => {
		const userNotif = n.userNotifications.find((un) => un.receiver.id === userId);

	    return {
	      id: n.id,
	      title: lang === LanguagesEnum.ARABIC ? n.arTitle : n.enTitle,
	      body: lang === LanguagesEnum.ARABIC ? n.arBody : n.enBody,
	      createdAt: n.createdAt,
	      isRead: userNotif?.isRead ?? false,
	    };
	  });

	  return this.paginatorService.makePaginate(mappedNotifications, total, take, page);
	}


  private prepareNotificationContent(
    dto: sendNotificationDto,
    templateKey?: keyof typeof NotificationTemplates,
    templateData?: Record<string, any>,
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
      arTitle: dto.arTitle || '',
      enTitle: dto.enTitle || '',
      arBody: dto.arBody || '',
      enBody: dto.enBody || '',
    };
  }

  private async resolveReceiverIds(receiverType?: ReceiverTypes, receiverIds?: number[]): Promise<number[]> {
    if (receiverType === ReceiverTypes.INDIVIDUAL && receiverIds?.length) {
      return receiverIds;
    }

    let userType: UsersTypes ;

    switch (receiverType) {
      case ReceiverTypes.ALL_CLIENTS:
        	userType = UsersTypes.USER;
        break;
      case ReceiverTypes.ALL_TECHNICIAN:
        	userType = UsersTypes.TECHNICAL;
        break;

	  case ReceiverTypes.ALL_USERS:
      default:
           userType = null;
        break;
  	}

    const users = await this.usersService.findAllIds(userType); 
    return users.map((u) => u.id);
  }

  private async sendFcm(userIds: number[], { title, body }: { title: string; body: string }) {
    const tokens = await this.usersService.getFcmTokensByUserIds(userIds);
    if (!tokens.length) {
      console.warn('⚠️ No FCM tokens found for given users');
      return { sent: 0, failed: userIds.length };
    }

    try {
      const response = await admin.messaging().sendEachForMulticast({
        notification: { title, body },
        tokens: tokens.map((t) => t.fcm_token),
      });

      console.log(`✅ Sent ${response.successCount} | ❌ Failed ${response.failureCount}`);
      return response;
    } catch (error) {
      console.error('❌ FCM send error:', error);
      return { error };
    }
  }

  private replaceTemplate(text: string, data: Record<string, any> = {}): string {
    return text.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] || '');
  }
}
