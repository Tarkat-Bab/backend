import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";
import { PaginatorInput } from "src/common/paginator/types/paginate.input";

export class FilterReviewDto extends PaginatorInput{
    // @ApiProperty({ example: 1, description: 'ID of the technician to filter reviews' , required: true})
    // @IsNotEmpty()
    // @IsNumber()
    // technicianId?: number;
}