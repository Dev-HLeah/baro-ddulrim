import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { IssueType, Urgency } from "../../generated/prisma/client";

export class UpdateReportDto {
  @IsOptional()
  @IsEnum(IssueType)
  issueType?: IssueType | null;

  @IsOptional()
  @IsEnum(Urgency)
  urgency?: Urgency;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  summary?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressText?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  roadAddressText?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  placeName?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string | null;
}

export class ApproveReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string | null;
}

export class AssignReportDto {
  @IsString()
  bidId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  selectionReason?: string | null;

  @IsOptional()
  @IsString()
  templateId?: string | null;
}
