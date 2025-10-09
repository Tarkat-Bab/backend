import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, Max, Min } from "class-validator";

export class CreateLocationDto {
  @ApiProperty({
    description: "Latitude Point",
    type: Number,
    example: 30.0444, 
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude: number;

  @ApiProperty({
    description: "Longitude Point",
    type: Number,
    example: 31.2357, 
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude: number;

  @ApiProperty({
    description: "Address without latitude and longitude",
    type: String,
    example: "القاهرة، مصر", 
  })
  @IsOptional()
  @IsNotEmpty()
  address?: string;
}
