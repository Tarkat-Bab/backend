import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class UpdateProfileDto {
    @ApiProperty({
        description: 'The phone number of the parent (optional)',
        example: '+1234567890',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    phone?: string;

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

}