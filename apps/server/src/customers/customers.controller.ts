import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query
} from "@nestjs/common";
import { IsString, MaxLength } from "class-validator";
import { CustomersService } from "./customers.service";

class CreateCustomerReplyDto {
  @IsString()
  @MaxLength(40)
  phone!: string;

  @IsString()
  @MaxLength(2000)
  content!: string;
}

@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get("reports")
  async findReportsByPhone(@Query("phone") phone?: string) {
    if (!phone?.trim()) {
      throw new BadRequestException("연락처를 입력해 주세요.");
    }

    return this.customersService.findReportsByPhone(phone);
  }

  @Get("reports/verify")
  async findReportByVerification(
    @Query("reportNo") reportNo?: string,
    @Query("verificationCode") verificationCode?: string
  ) {
    if (!reportNo?.trim() || !verificationCode?.trim()) {
      throw new BadRequestException("접수번호와 확인번호를 입력해 주세요.");
    }

    const report = await this.customersService.findReportByVerification(reportNo, verificationCode);

    if (!report) {
      throw new NotFoundException("신고를 찾을 수 없습니다.");
    }

    return report;
  }

  @Post("reports/:reportNo/messages")
  async addCustomerReply(
    @Param("reportNo") reportNo: string,
    @Body() dto: CreateCustomerReplyDto
  ) {
    return this.customersService.addCustomerReply(reportNo, dto.phone, dto.content);
  }
}
