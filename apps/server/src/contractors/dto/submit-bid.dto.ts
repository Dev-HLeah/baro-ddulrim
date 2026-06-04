import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class SubmitBidDto {
  @IsString()
  reportId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedPrice?: number | null;

  @IsOptional()
  @IsString()
  availableTime?: string | null;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  canWork?: boolean;

  @IsOptional()
  @IsString()
  workNote?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  extraCostPolicy?: string | null;
}
