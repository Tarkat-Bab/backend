import { PaginatorInput } from "src/common/paginator/types/paginate.input";
import { RequestStatus } from "../enums/requestStatus.enum";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";

export class FilterRequestDto extends PaginatorInput{
    @ApiProperty({ description: 'Filter by status',required: false, enum: RequestStatus })
    @IsEnum(RequestStatus)
    @IsOptional()
    status?: RequestStatus;

    @ApiProperty({ description: 'Filter by service ID', required: false })
    @IsOptional()
    serviceId?: number;

    @ApiProperty({ description: 'Filter by requester name or request address', required: false })
    @IsOptional()
    search?: string;
}

export class FilterRequestByStatusDto extends PaginatorInput{
    @ApiProperty({ description: 'Filter by status',required: false, enum: RequestStatus })
    @IsEnum(RequestStatus)
    @IsOptional()
    status?: RequestStatus;
}

export class FilterRequestByServiceDto extends PaginatorInput{
    @ApiProperty({ description: 'Filter by service ID', required: false })
    @IsNotEmpty()
    serviceId?: number;
}