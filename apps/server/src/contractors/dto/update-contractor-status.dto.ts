import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ContractorStatus } from "../../generated/prisma/client";

export class UpdateContractorStatusDto {
  @IsEnum(ContractorStatus)
  status!: ContractorStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  statusReason?: string | null;
}
