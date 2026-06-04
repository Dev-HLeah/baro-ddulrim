import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { WorkStatus } from "../../generated/prisma/client";

export class SubmitWorkUpdateDto {
  @IsEnum(WorkStatus)
  status!: WorkStatus;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  finalPrice?: number | null;
}
