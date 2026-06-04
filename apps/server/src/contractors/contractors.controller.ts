import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ContractorsService } from "./contractors.service";
import { SubmitBidDto } from "./dto/submit-bid.dto";

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

  @Post(":companyId/bids")
  async submitBid(@Param("companyId") companyId: string, @Body() dto: SubmitBidDto) {
    return this.contractorsService.submitBid(companyId, dto);
  }
}
