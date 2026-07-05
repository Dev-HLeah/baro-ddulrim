import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { AdminGuard } from "../auth/admin.guard";
import { CurrentAdmin } from "../auth/auth.decorators";
import type { AuthAdmin } from "../auth/auth.types";
import { CreateCustomerReportDto } from "./dto/create-customer-report.dto";
import {
  ApproveReportDto,
  AssignReportDto,
  SendAdminMessageDto,
  UpdateReportDto
} from "./dto/report-actions.dto";
import { ReportsService } from "./reports.service";

type UploadedReportFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor("attachments", 5, {
      limits: {
        fileSize: 20 * 1024 * 1024
      }
    })
  )
  async createCustomerReport(
    @Body() dto: CreateCustomerReportDto,
    @UploadedFiles() files: UploadedReportFile[]
  ) {
    return this.reportsService.createFromCustomer(dto, files ?? []);
  }

  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return this.reportsService.findAll();
  }

  @Get(":id")
  @UseGuards(AdminGuard)
  async findOne(@Param("id") id: string) {
    const report = await this.reportsService.findOne(id);

    if (!report) {
      throw new NotFoundException("신고를 찾을 수 없습니다.");
    }

    return report;
  }

  @Patch(":id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: UpdateReportDto) {
    return this.reportsService.update(id, dto);
  }

  @Post(":id/messages")
  @UseGuards(AdminGuard)
  async sendAdminMessage(
    @CurrentAdmin() admin: AuthAdmin,
    @Param("id") id: string,
    @Body() dto: SendAdminMessageDto
  ) {
    return this.reportsService.sendAdminMessage(id, dto, admin.id);
  }

  @Post(":id/approve")
  @UseGuards(AdminGuard)
  async approveForBidding(@Param("id") id: string, @Body() dto: ApproveReportDto) {
    return this.reportsService.approveForBidding(id, dto);
  }

  @Post(":id/assign")
  @UseGuards(AdminGuard)
  async assignContractor(
    @CurrentAdmin() admin: AuthAdmin,
    @Param("id") id: string,
    @Body() dto: AssignReportDto
  ) {
    return this.reportsService.assignContractor(id, dto, admin.id);
  }
}
