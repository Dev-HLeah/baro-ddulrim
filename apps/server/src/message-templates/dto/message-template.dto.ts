import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { TemplateChannel } from "../../generated/prisma/client";

export class CreateMessageTemplateDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsEnum(TemplateChannel)
  channel?: TemplateChannel;

  @IsString()
  content!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMessageTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsEnum(TemplateChannel)
  channel?: TemplateChannel;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
