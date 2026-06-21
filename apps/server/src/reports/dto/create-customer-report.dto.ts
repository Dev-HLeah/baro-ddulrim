import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCustomerReportDto {
  @IsString()
  @MaxLength(40)
  phone!: string;

  @IsString()
  @MaxLength(200)
  location!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  summary?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  placeName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  roadAddressText?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number | null;
}
