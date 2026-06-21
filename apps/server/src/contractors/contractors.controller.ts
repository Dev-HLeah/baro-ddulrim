import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ContractorsService } from "./contractors.service";
import { RegisterContractorDto } from "./dto/register-contractor.dto";
import { SubmitBidDto } from "./dto/submit-bid.dto";
import { SubmitWorkUpdateDto } from "./dto/submit-work-update.dto";
import { UpdateContractorStatusDto } from "./dto/update-contractor-status.dto";

type UploadedContractorFiles = {
  businessLicense?: Array<{ buffer: Buffer; mimetype: string; originalname: string; size: number }>;
  companyPhoto?: Array<{ buffer: Buffer; mimetype: string; originalname: string; size: number }>;
};

@Controller("contractors")
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Post("register")
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "businessLicense", maxCount: 1 },
        { name: "companyPhoto", maxCount: 1 }
      ],
      {
        limits: {
          fileSize: 20 * 1024 * 1024
        }
      }
    )
  )
  async registerCompany(
    @Body() dto: RegisterContractorDto,
    @UploadedFiles() files: UploadedContractorFiles
  ) {
    return this.contractorsService.registerCompany(dto, files ?? {});
  }

  @Get("admin/companies")
  async findCompaniesForAdmin() {
    return this.contractorsService.findCompaniesForAdmin();
  }

  @Patch("admin/companies/:companyId/status")
  async updateCompanyStatus(
    @Param("companyId") companyId: string,
    @Body() dto: UpdateContractorStatusDto
  ) {
    return this.contractorsService.updateCompanyStatus(companyId, dto);
  }

  @Get("companies")
  async findCompanies() {
    return this.contractorsService.findCompanies();
  }

  @Get("companies/:companyId")
  async findCompanyProfile(@Param("companyId") companyId: string) {
    return this.contractorsService.findCompanyProfile(companyId);
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
