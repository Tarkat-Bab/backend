import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class SavePaymentDto {

    @ApiProperty({
        description:"Payment ID from Tabby",
        example: "pay_1234567890",
    })
    @IsNotEmpty()
    paymentTabbyId: string;

    @ApiProperty({
        description:"Amount to be paid",
        example: 100.50,
    })
    @IsNotEmpty()
    amount: number;

    @ApiProperty({
        description:"Currency of the payment",
        example: "SAR",
    })
    @IsNotEmpty()
    currency: string;

    @ApiProperty({
        description:"Status of the payment",
        example: "completed",
    })
    @IsNotEmpty()
    status: string;

    @ApiProperty({
        description:"Payment creation date",
        example: "2024-10-01T12:00:00Z",
    })
    @IsNotEmpty()
    createdAt: string;

    @ApiProperty({
        description:"Total amount charged to the client",
        example: 115.50,
    })
    @IsNotEmpty()
    totalClientAmount: number;

    @ApiProperty({
        description:"Amount allocated to the platform",
        example: 5.00,
    })
    @IsNotEmpty()
    platformAmount: number;

    @ApiProperty({
        description:"Amount allocated to the technician",
        example: 90.00,
    })
    @IsNotEmpty()
    technicianAmount: number;

    @ApiProperty({
        description:"Amount allocated to taxes",
        example: 15.00,
    })
    @IsNotEmpty()
    taxAmount: number;
}