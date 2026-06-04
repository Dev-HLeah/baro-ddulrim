import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { toIso, toNumber } from "../common/format";
import {
  ActorType,
  BidStatus,
  ContractorStatus,
  ReportStatus,
  WorkStatus
} from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SubmitBidDto } from "./dto/submit-bid.dto";
import { SubmitWorkUpdateDto } from "./dto/submit-work-update.dto";

const usableContractorStatuses: ContractorStatus[] = [
  ContractorStatus.APPROVED,
  ContractorStatus.ACTIVE
];

const biddableReportStatuses: ReportStatus[] = [
  ReportStatus.APPROVED_FOR_BIDDING,
  ReportStatus.BIDDING
];

const reportStatusByWorkStatus: Record<WorkStatus, ReportStatus> = {
  [WorkStatus.DISPATCH_SCHEDULED]: ReportStatus.DISPATCH_SCHEDULED,
  [WorkStatus.DISPATCHED]: ReportStatus.DISPATCHED,
  [WorkStatus.IN_PROGRESS]: ReportStatus.IN_PROGRESS,
  [WorkStatus.RESOLVED]: ReportStatus.RESOLVED
};

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

  async findAssignments(companyId: string) {
    const company = await this.findUsableCompany(companyId);
    const assignments = await this.prisma.assignment.findMany({
      where: {
        contractorCompanyId: company.id
      },
      orderBy: { assignedAt: "desc" },
      include: {
        bid: true,
        report: true,
        workUpdates: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    return assignments.map((assignment) => this.serializeAssignment(assignment));
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

  async submitWorkUpdate(companyId: string, assignmentId: string, dto: SubmitWorkUpdateDto) {
    if (dto.status === WorkStatus.RESOLVED && dto.finalPrice == null) {
      throw new BadRequestException("해결 완료 처리에는 최종 금액이 필요합니다.");
    }

    const assignment = await this.prisma.$transaction(async (tx) => {
      const existingAssignment = await tx.assignment.findFirst({
        where: {
          id: assignmentId,
          contractorCompanyId: companyId
        },
        include: {
          report: true
        }
      });

      if (!existingAssignment) {
        throw new NotFoundException("배정 작업을 찾을 수 없습니다.");
      }

      const nextReportStatus = reportStatusByWorkStatus[dto.status];
      const now = new Date();
      const note = this.cleanString(dto.note);

      await tx.workUpdate.create({
        data: {
          reportId: existingAssignment.reportId,
          assignmentId: existingAssignment.id,
          contractorCompanyId: existingAssignment.contractorCompanyId,
          status: dto.status,
          note,
          finalPrice: dto.status === WorkStatus.RESOLVED ? dto.finalPrice ?? null : null
        }
      });

      await tx.report.update({
        where: { id: existingAssignment.reportId },
        data: {
          status: nextReportStatus,
          resolvedAt: dto.status === WorkStatus.RESOLVED ? existingAssignment.report.resolvedAt ?? now : undefined
        }
      });

      if (existingAssignment.report.status !== nextReportStatus) {
        await tx.reportStatusHistory.create({
          data: {
            reportId: existingAssignment.reportId,
            fromStatus: existingAssignment.report.status,
            toStatus: nextReportStatus,
            actorType: ActorType.CONTRACTOR,
            reason: note ?? this.defaultWorkUpdateReason(dto.status)
          }
        });
      }

      return tx.assignment.findUniqueOrThrow({
        where: { id: existingAssignment.id },
        include: {
          bid: true,
          report: true,
          workUpdates: {
            orderBy: { createdAt: "asc" }
          }
        }
      });
    });

    return this.serializeAssignment(assignment);
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

  private serializeAssignment(assignment: {
    id: string;
    reportId: string;
    bidId: string;
    contractorCompanyId: string;
    selectionReason: string | null;
    customerMessageRendered: string | null;
    assignedAt: Date;
    createdAt: Date;
    bid: {
      estimatedPrice: number | null;
      availableTime: Date | null;
      workNote: string | null;
      extraCostPolicy: string | null;
    };
    report: {
      id: string;
      reportNo: string;
      status: ReportStatus;
      issueType: string | null;
      urgency: string;
      summary: string | null;
      description: string | null;
      addressText: string | null;
      roadAddressText: string | null;
      placeName: string | null;
      latitude: Parameters<typeof toNumber>[0];
      longitude: Parameters<typeof toNumber>[0];
      assignedAt: Date | null;
      resolvedAt: Date | null;
      createdAt: Date;
    };
    workUpdates: Array<{
      id: string;
      status: WorkStatus;
      note: string | null;
      finalPrice: number | null;
      createdAt: Date;
    }>;
  }) {
    const latestWorkUpdate = assignment.workUpdates.at(-1) ?? null;

    return {
      id: assignment.id,
      reportId: assignment.reportId,
      bidId: assignment.bidId,
      contractorCompanyId: assignment.contractorCompanyId,
      selectionReason: assignment.selectionReason,
      customerMessageRendered: assignment.customerMessageRendered,
      assignedAt: toIso(assignment.assignedAt),
      createdAt: toIso(assignment.createdAt),
      bid: {
        estimatedPrice: assignment.bid.estimatedPrice,
        availableTime: toIso(assignment.bid.availableTime),
        workNote: assignment.bid.workNote,
        extraCostPolicy: assignment.bid.extraCostPolicy
      },
      report: {
        id: assignment.report.id,
        reportNo: assignment.report.reportNo,
        status: assignment.report.status,
        issueType: assignment.report.issueType,
        urgency: assignment.report.urgency,
        summary: assignment.report.summary,
        description: assignment.report.description,
        addressText: assignment.report.addressText,
        roadAddressText: assignment.report.roadAddressText,
        placeName: assignment.report.placeName,
        latitude: toNumber(assignment.report.latitude),
        longitude: toNumber(assignment.report.longitude),
        assignedAt: toIso(assignment.report.assignedAt),
        resolvedAt: toIso(assignment.report.resolvedAt),
        createdAt: toIso(assignment.report.createdAt)
      },
      latestWorkStatus: latestWorkUpdate?.status ?? null,
      workUpdates: assignment.workUpdates.map((update) => ({
        id: update.id,
        status: update.status,
        note: update.note,
        finalPrice: update.finalPrice,
        createdAt: toIso(update.createdAt)
      }))
    };
  }

  private defaultWorkUpdateReason(status: WorkStatus) {
    const labels: Record<WorkStatus, string> = {
      [WorkStatus.DISPATCH_SCHEDULED]: "출동 예정",
      [WorkStatus.DISPATCHED]: "출동 완료",
      [WorkStatus.IN_PROGRESS]: "처리중",
      [WorkStatus.RESOLVED]: "해결 완료"
    };

    return labels[status];
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
