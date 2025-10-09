import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";
import { UsersTypes } from "src/common/enums/users.enum";

export class ForgetPasswordDto {
    @ApiProperty({
        description: 'User email',
        example: 'user@gmail.com',
        required: true,
        type: String
    })
    @IsEmail()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({
        description: 'User type',
        example: UsersTypes.USER,
        required: true,
        type: String,
        enum: [UsersTypes.USER, UsersTypes.TECHNICAL]
    })
    @IsNotEmpty()
    type: UsersTypes;
}

export class ForgetAdminPasswordDto {
    @ApiProperty({
        description: 'Admin email',
        example: 'admin@gmail.com',
        required: true,
        type: String
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}