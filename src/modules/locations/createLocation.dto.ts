import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateLocationDto {
  @ApiProperty({
    description: "Latitude Point",
    type: Number,
    example: 30.0444, 
  })
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: "Longitude Point",
    type: Number,
    example: 31.2357, 
  })
  @IsNotEmpty()
  @IsNumber()
  longitude: number;
}
