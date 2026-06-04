import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { toIso, toNumber } from "../common/format";
import {
  ActorType,
  BidStatus,
  ContractorStatus,
  ReportStatus
} from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SubmitBidDto } from "./dto/submit-bid.dto";

const usableContractorStatuses: ContractorStatus[] = [
  ContractorStatus.APPROVED,
  ContractorStatus.ACTIVE
];

const biddableReportStatuses: ReportStatus[] = [
  ReportStatus.APPROVED_FOR_BIDDING,
  ReportStatus.BIDDING
];

@Injectable()
export class ContractorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findCompanies() {
    const companies = await this.prisma.contractorCompany.findMany({
      where: {
        status: {
          in: [ContractorStatus.APPROVED, ContractorStatus.ACTIVE]
        }
      },
      orderBy: [{ status: "asc" }, { companyName: "asc" }],
      include: {
        account: true,
        _count: {
          select: {
            bids: true,
            assignments: true,
            workUpdates: true
          }
        }
      }
    });

    return companies.map((company) => ({
      id: company.id,
      companyName: company.companyName,
      representativeName: company.representativeName,
      phone: company.account.phone,
      email: company.account.email,
      status: company.status,
      serviceRegions: company.serviceRegions,
      serviceRadiusKm: company.serviceRadiusKm,
      address: company.address,
      latitude: toNumber(company.latitude),
      longitude: toNumber(company.longitude),
      bidCount: company._count.bids,
      assignmentCount: company._count.assignments,
      workUpdateCount: company._count.workUpdates
    }));
  }

  async findOpportunities(companyId: string) {
    const company = await this.findUsableCompany(companyId);
    const reports = await this.prisma.report.findMany({
      where: {
        status: {
          in: [ReportStatus.APPROVED_FOR_BIDDING, ReportStatus.BIDDING]
        },
        assignment: null
      },
      orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
      include: {
        bids: {
          where: {
            contractorCompanyId: company.id
          },
          orderBy: { submittedAt: "desc" },
          take: 1
        },
        _count: {
          select: {
            bids: true,
            attachments: true,
            messages: true
          }
        }
      }
    });

    return reports.map((report) => ({
      id: report.id,
      reportNo: report.reportNo,
      status: report.status,
      issueType: report.issueType,
      urgency: report.urgency,
      summary: report.summary,
      description: report.description,
      addressText: report.addressText,
      roadAddressText: report.roadAddressText,
      placeName: report.placeName,
      latitude: toNumber(report.latitude),
      longitude: toNumber(report.longitude),
      bidCount: report._count.bids,
      attachmentCount: report._count.attachments,
      messageCount: report._count.messages,
      createdAt: toIso(report.createdAt),
      adminApprovedAt: toIso(report.adminApprovedAt),
      myBid: report.bids[0] ? this.serializeBid(report.bids[0]) : null
    }));
  }

  async findBids(companyId: string) {
    const company = await this.findUsableCompany(companyId);
    const bids = await this.prisma.bid.findMany({
      where: {
        contractorCompanyId: company.id
      },
      orderBy: { submittedAt: "desc" },
      include: {
        report: {
          include: {
            assignment: {
              include: {
                contractorCompany: true
              }
            }
          }
        }
      }
    });

    return bids.map((bid) => ({
      ...this.serializeBid(bid),
      report: {
        id: bid.report.id,
        reportNo: bid.report.reportNo,
        status: bid.report.status,
        issueType: bid.report.issueType,
        urgency: bid.report.urgency,
        summary: bid.report.summary,
        placeName: bid.report.placeName,
        addressText: bid.report.addressText,
        assignedCompanyName: bid.report.assignment?.contractorCompany.companyName ?? null,
        createdAt: toIso(bid.report.createdAt),
        assignedAt: toIso(bid.report.assignedAt),
        resolvedAt: toIso(bid.report.resolvedAt)
      }
    }));
  }

  async submitBid(companyId: string, dto: SubmitBidDto) {
    const availableTime = this.parseAvailableTime(dto.availableTime);

    const bid = await this.prisma.$transaction(async (tx) => {
      const company = await tx.contractorCompany.findUnique({
        where: { id: companyId }
      });

      if (!company || !usableContractorStatuses.includes(company.status)) {
        throw new NotFoundException("입찰 가능한 업체를 찾을 수 없습니다.");
      }

      const report = await tx.report.findFirst({
        where: {
          OR: [{ id: dto.reportId }, { reportNo: dto.reportId }]
        },
        include: {
          assignment: true
        }
      });

      if (!report) {
        throw new NotFoundException("신고를 찾을 수 없습니다.");
      }

      if (report.assignment || !biddableReportStatuses.includes(report.status)) {
        throw new BadRequestException("현재 입찰할 수 없는 신고입니다.");
      }

      const existingBid = await tx.bid.findUnique({
        where: {
          reportId_contractorCompanyId: {
            reportId: report.id,
            contractorCompanyId: company.id
          }
        }
      });

      if (existingBid && existingBid.status !== BidStatus.SUBMITTED) {
        throw new ConflictException("이미 확정 처리된 입찰은 수정할 수 없습니다.");
      }

      const submittedBid = await tx.bid.upsert({
        where: {
          reportId_contractorCompanyId: {
            reportId: report.id,
            contractorCompanyId: company.id
          }
        },
        update: {
          estimatedPrice: dto.estimatedPrice ?? null,
          availableTime,
          canWork: dto.canWork ?? true,
          workNote: this.cleanString(dto.workNote),
          extraCostPolicy: this.cleanString(dto.extraCostPolicy),
          status: BidStatus.SUBMITTED,
          submittedAt: new Date()
        },
        create: {
          reportId: report.id,
          contractorCompanyId: company.id,
          estimatedPrice: dto.estimatedPrice ?? null,
          availableTime,
          canWork: dto.canWork ?? true,
          workNote: this.cleanString(dto.workNote),
          extraCostPolicy: this.cleanString(dto.extraCostPolicy),
          status: BidStatus.SUBMITTED
        }
      });

      if (report.status === ReportStatus.APPROVED_FOR_BIDDING) {
        await tx.report.update({
          where: { id: report.id },
          data: { status: ReportStatus.BIDDING }
        });

        await tx.reportStatusHistory.create({
          data: {
            reportId: report.id,
            fromStatus: report.status,
            toStatus: ReportStatus.BIDDING,
            actorType: ActorType.CONTRACTOR,
            reason: "업체 입찰 제출"
          }
        });
      }

      return submittedBid;
    });

    return this.serializeBid(bid);
  }

  private async findUsableCompany(companyId: string) {
    const company = await this.prisma.contractorCompany.findUnique({
      where: { id: companyId }
    });

    if (!company || !usableContractorStatuses.includes(company.status)) {
      throw new NotFoundException("입찰 가능한 업체를 찾을 수 없습니다.");
    }

    return company;
  }

  private serializeBid(bid: {
    id: string;
    reportId: string;
    contractorCompanyId: string;
    estimatedPrice: number | null;
    availableTime: Date | null;
    canWork: boolean;
    workNote: string | null;
    extraCostPolicy: string | null;
    status: BidStatus;
    submittedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: bid.id,
      reportId: bid.reportId,
      contractorCompanyId: bid.contractorCompanyId,
      estimatedPrice: bid.estimatedPrice,
      availableTime: toIso(bid.availableTime),
      canWork: bid.canWork,
      workNote: bid.workNote,
      extraCostPolicy: bid.extraCostPolicy,
      status: bid.status,
      submittedAt: toIso(bid.submittedAt),
      createdAt: toIso(bid.createdAt),
      updatedAt: toIso(bid.updatedAt)
    };
  }

  private cleanString(value: string | null | undefined) {
    if (value == null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseAvailableTime(value: string | null | undefined) {
    const cleaned = this.cleanString(value);

    if (!cleaned) {
      return null;
    }

    const parsed = new Date(cleaned);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException("출동 가능 시간이 올바르지 않습니다.");
    }

    return parsed;
  }
}
