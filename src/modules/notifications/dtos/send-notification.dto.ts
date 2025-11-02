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

	// // optional: array of FCM tokens to send to (manual send)
	// @ApiProperty({ required: false, description: 'Array of FCM device tokens for apps', type: [String] })
	// @IsOptional()
	// @IsArray()
	// @ArrayNotEmpty()
	// @IsString({ each: true })
	// tokens?: string[];

	// optional: specific receiver user id (used to persist/link notification)
	@ApiProperty({ required: false, description: 'Receivers types for dashboard', enum: [ReceiverTypes.ALL_CLIENTS, ReceiverTypes.ALL_TECHNICIAN, ReceiverTypes.ALL_USERS], example: ReceiverTypes.ALL_CLIENTS })
	@IsOptional()
	@IsEnum(ReceiverTypes)
	receiversType?: ReceiverTypes;
}