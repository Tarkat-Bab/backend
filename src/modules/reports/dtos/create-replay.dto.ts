import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateReplyDto {
    @ApiProperty({
        description: 'The content of the reply',
        example: 'This is a reply to the report.'
    })
    @IsNotEmpty()
    @IsString()
    content: string;
}