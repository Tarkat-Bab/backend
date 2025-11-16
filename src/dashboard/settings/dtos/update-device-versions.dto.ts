import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class UpdateDeviceVersionDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      updated_at: "2025-08-08T10:30:00Z",
      updated_by: "[email protected]",
      change_reason: "Hotfix: block 5.2.7 and raise minimums"
    }
  })
  @IsOptional()
  @IsObject()
  meta: any;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      exact_blocked_version: "5.2.7",
      min_supported_version: "5.3.0",
      maintenance_mode: false,
      maintenance_message: "Scheduled maintenance. We'll be back soon."
    }
  })
  @IsObject()
  @IsOptional()
  android: any;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      exact_blocked_version: "",
      min_supported_version: "5.4.0",
      maintenance_mode: false,
      maintenance_message: "Maintenance in progress. Please try again later."
    }
  })
  @IsObject()
  @IsOptional()
  ios: any;
}
