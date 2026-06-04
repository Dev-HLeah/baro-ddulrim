import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { ApproveReportDto, AssignReportDto, UpdateReportDto } from "./dto/report-actions.dto";
import { ReportsService } from "./reports.service";

@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async findAll() {
    return this.reportsService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const report = await this.reportsService.findOne(id);

    if (!report) {
      throw new NotFoundException("신고를 찾을 수 없습니다.");
    }

    return report;
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateReportDto) {
    return this.reportsService.update(id, dto);
  }

  @Post(":id/approve")
  async approveForBidding(@Param("id") id: string, @Body() dto: ApproveReportDto) {
    return this.reportsService.approveForBidding(id, dto);
  }

  @Post(":id/assign")
  async assignContractor(@Param("id") id: string, @Body() dto: AssignReportDto) {
    return this.reportsService.assignContractor(id, dto);
  }
}
