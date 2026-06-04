import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ContractorsService } from "./contractors.service";
import { SubmitBidDto } from "./dto/submit-bid.dto";
import { SubmitWorkUpdateDto } from "./dto/submit-work-update.dto";

@Controller("contractors")
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Get("companies")
  async findCompanies() {
    return this.contractorsService.findCompanies();
  }

  @Get(":companyId/opportunities")
  async findOpportunities(@Param("companyId") companyId: string) {
    return this.contractorsService.findOpportunities(companyId);
  }

  @Get(":companyId/bids")
  async findBids(@Param("companyId") companyId: string) {
    return this.contractorsService.findBids(companyId);
  }

  @Get(":companyId/assignments")
  async findAssignments(@Param("companyId") companyId: string) {
    return this.contractorsService.findAssignments(companyId);
  }

  @Post(":companyId/bids")
  async submitBid(@Param("companyId") companyId: string, @Body() dto: SubmitBidDto) {
    return this.contractorsService.submitBid(companyId, dto);
  }

  @Post(":companyId/assignments/:assignmentId/work-updates")
  async submitWorkUpdate(
    @Param("companyId") companyId: string,
    @Param("assignmentId") assignmentId: string,
    @Body() dto: SubmitWorkUpdateDto
  ) {
    return this.contractorsService.submitWorkUpdate(companyId, assignmentId, dto);
  }
}
