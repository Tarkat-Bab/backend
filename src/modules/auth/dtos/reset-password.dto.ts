import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, Matches } from "class-validator";

export class ResetPasswordDto {
    @ApiProperty({
        description: 'user email',
        type: String,
        example: 'john@gmail.com',
      })
      @IsNotEmpty()
      @IsEmail()
      email: string;

    @ApiProperty({
        description: 'User Password',
        example: '123456R@#',
        required: true,
        type: String
    })
    @IsNotEmpty()
    @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, {
      message: 'Password must be at least 8 characters long and contain both letters and numbers.',
    })
    newPassword: string;

    @ApiProperty({
        description: 'User Password',
        example: '123456@#',
        required: true,
        type: String
    })
    @IsNotEmpty()
    confirmPassword: string;
}