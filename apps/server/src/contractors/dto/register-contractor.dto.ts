import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class RegisterContractorDto {
  @IsString()
  @MaxLength(120)
  email!: string;

  @IsString()
  @MaxLength(60)
  name!: string;

  @IsString()
  @MaxLength(40)
  phone!: string;

  @IsString()
  @MaxLength(120)
  companyName!: string;

  @IsString()
  @MaxLength(60)
  representativeName!: string;

  @IsString()
  @MaxLength(40)
  businessNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string | null;

  @IsOptional()
  @IsString()
  serviceRegions?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  serviceRadiusKm?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  yearsOfExperience?: number | null;

  @IsOptional()
  specialties?: string[] | string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number | null;
}
