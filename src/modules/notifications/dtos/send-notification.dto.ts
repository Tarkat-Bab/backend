import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional, IsArray, IsInt, IsObject, ArrayNotEmpty, IsEnum } from "class-validator";
import { ReceiverTypes } from "../enums/receiverTypes.enum";

export class sendNotificationDto {
	// language-specific titles/bodies (match NotificationsEntity)
	@ApiProperty({ description: 'Arabic title', required: false })
	@IsOptional()
	@IsString()
	arTitle?: string;

	@ApiProperty({ description: 'English title', required: false })
	@IsOptional()
	@IsString()
	enTitle?: string;

	@ApiProperty({ description: 'Arabic body', required: false })
	@IsOptional()
	@IsString()
	arBody?: string;

	@ApiProperty({ description: 'English body', required: false })
	@IsOptional()
	@IsString()
	enBody?: string;

	@ApiProperty({ required: false, description: 'Receivers types for dashboard', enum: [ReceiverTypes.ALL_CLIENTS, ReceiverTypes.ALL_TECHNICIAN, ReceiverTypes.ALL_USERS], example: ReceiverTypes.ALL_CLIENTS })
	@IsOptional()
	@IsEnum(ReceiverTypes)
	receiversType?: ReceiverTypes;
}