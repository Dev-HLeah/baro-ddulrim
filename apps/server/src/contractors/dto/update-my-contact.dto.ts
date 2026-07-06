import { IsString, MaxLength } from "class-validator";

export class UpdateMyContactDto {
  @IsString()
  @MaxLength(40)
  phone!: string;
}
