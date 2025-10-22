import { ApiProperty } from "@nestjs/swagger";
import { ReportReason } from "../enums/reports.enum";
import { IsOptional } from "class-validator";

export class CreateReportDto {
    @ApiProperty({
        description: "Report reason",
        enum: ReportReason,
        example: ReportReason.badQualityWork,
        required: true,
    })
    reason: ReportReason;

    @ApiProperty({
        description: "Detailed message about the report",
        example: "The technician did not complete the work as agreed.",
        required: true,
    })
    message: string;

    @ApiProperty({
        description: "Person ID being reported",
        example: 42,
        required: true,
    })
    reportedId?: number;

    @ApiProperty({
        description: "Request ID related to the report",
        example: 42,
        required: true,
    })
    requestId?: number;

    @ApiProperty({
        description: "Array of image files related to the report",
        type: 'string',
        format: 'binary',
        isArray: true,
        required: false,
    })
    @IsOptional()
    images?: string[];
}