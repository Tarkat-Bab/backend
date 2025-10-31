import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Max, MAX, Min } from "class-validator";

export class CreateReviewDto {
    @ApiProperty({ example: 4, description: 'Rating given by the user' })
    @Min(1)
    @Max(5)
    rate: number;

    @ApiProperty({ example: 'Great service!', description: 'Comment provided by the user' })
    comment: string;

    @ApiProperty({ example: 1, description: 'ID of the request being reviewed' })
    @IsNotEmpty()
    requestId: number;
}