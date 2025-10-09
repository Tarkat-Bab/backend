import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateLocationDto } from 'src/modules/locations/createLocation.dto';

export class UpdateProfileDto {
    @ApiProperty({
        description: 'The name of the parent (optional)',
        example: 'John Smith',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    username?: string;

    @ApiProperty({
        description: 'The profile image of the user (optional)',
        type: 'string',
        format: 'binary',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    image?: Express.Multer.File;

    @ApiProperty({
      required: false,
      description: 'User Location (Latitude, Longitude)',
      type: CreateLocationDto
    })
    @IsOptional()
    // @ValidateNested()
    @Type(() => CreateLocationDto)
    location?: CreateLocationDto;

    @ApiProperty({
        description: 'the description of the technical profile (optional)',
        example: 'Experienced air conditioning technician with 5 years of service.',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    description?: string;
}