import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Min } from "class-validator";
import { PaginatorInput } from "src/common/paginator/types/paginate.input";

export class FilterPaymentsDto extends PaginatorInput{
    @ApiProperty({
        description: 'Search by user name or technician name or request title',
        type: String,
        required: false
    })
    @IsNotEmpty()
    @IsString()
    @IsOptional()
    search?: string;
}