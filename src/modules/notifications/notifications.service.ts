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
import { FilterUsersDto } from '../users/dtos/filter-user-dto';
import { UsersTypes } from 'src/common/enums/users.enum';

@Injectable()
export class NotificationsService {
	constructor(
		@InjectRepository(NotificationsEntity)
		private readonly notificationRepo: Repository<NotificationsEntity>,

		@InjectRepository(UsersNotifications)
		private readonly usersNotificationsRepo: Repository<UsersNotifications>,

		private readonly usersService: UsersService,
	) {}

	/**
	 * 🔥 Unified method to send manual or template-based notification
	 */
	async sendManualNotification(
		dto: sendNotificationDto,
		receiverIds?: number[],
		templateKey?: keyof typeof NotificationTemplates,
		templateData?: Record<string, any>,
		lang: LanguagesEnum = LanguagesEnum.ENGLISH,
	) {
		const { arTitle, enTitle, arBody, enBody } = this.prepareNotificationContent(dto, templateKey, templateData);

		// 2️⃣ Create main notification record
		const notification = this.notificationRepo.create({
			arTitle,
			enTitle,
			arBody,
			enBody,
			receiverTypes: dto.receiversType || ReceiverTypes.INDIVIDUAL,
		});
		const savedNotification = await this.notificationRepo.save(notification);

		// 3️⃣ Determine receiver list
		const finalReceiverIds = await this.resolveReceiverIds(dto.receiversType, receiverIds);

		if (finalReceiverIds.length === 0) {
			console.warn('⚠️ No receivers found for this notification type.');
			return { success: false, message: 'No receivers found', notification: savedNotification };
		}

		// 4️⃣ Link notification to users
		await this.linkNotificationToUsers(savedNotification, finalReceiverIds);

		// 5️⃣ Send FCM notification
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

	/**
	 * 🧩 Prepare notification text from DTO or template
	 */
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

	/**
	 * 🎯 Resolve user IDs based on receiver type
	 */
	private async resolveReceiverIds(receiverType?: ReceiverTypes, receiverIds?: number[], lang?: LanguagesEnum) {
		let users;
		switch (receiverType) {
			case ReceiverTypes.ALL_USERS:
			case ReceiverTypes.ALL_CLIENTS:
			case ReceiverTypes.ALL_TECHNICIAN:
				users = await this.usersService.list({ type: this.mapReceiverTypeToUserType(receiverType) } as FilterUsersDto, lang);
				return users.map(user => user.id);
			case ReceiverTypes.INDIVIDUAL:
			default:
				return receiverIds || [];
		}
	}

	private mapReceiverTypeToUserType(receiverType: ReceiverTypes): UsersTypes | null {
		switch (receiverType) {
			case ReceiverTypes.ALL_CLIENTS:
				return UsersTypes.USER;
			case ReceiverTypes.ALL_TECHNICIAN:
				return UsersTypes.TECHNICAL;
			case ReceiverTypes.ALL_USERS:
			default:
				return null;
		}
	}

	/**
	 * 🗂️ Save UsersNotifications records
	 */
	private async linkNotificationToUsers(notification: NotificationsEntity, userIds: number[]) {
		const userNotifications = userIds.map((userId) =>
			this.usersNotificationsRepo.create({
				receiver: { id: userId },
				notification,
				isRead: false,
			}),
		);
		await this.usersNotificationsRepo.save(userNotifications);
	}

	/**
	 * 🚀 Send Firebase Cloud Messaging (FCM) push notification
	 */
	private async sendFcm(userIds: number[], { title, body }: { title: string; body: string }) {
		const tokens = await this.usersService.getFcmTokensByUserIds(userIds);
		if (!tokens.length) {
			console.warn('⚠️ No FCM tokens found for given users');
			return { sent: 0, failed: userIds.length };
		}

		const message = {
			notification: { title, body },
			tokens: tokens.map((t) => t.fcm_token),
		};

		try {
			const response = await admin.messaging().sendEachForMulticast(message);
			console.log(`✅ Sent ${response.successCount} | ❌ Failed ${response.failureCount}`);
			return response;
		} catch (error) {
			console.error('❌ FCM send error:', error);
			return { error };
		}
	}

	/**
	 * 🔧 Replace template placeholders with actual values
	 */
	private replaceTemplate(text: string, data: Record<string, any> = {}): string {
		return text.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] || '');
	}
}
