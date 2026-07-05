import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { toIso, toNumber } from "../common/format";
import {
  ActorType,
  MessageType,
  Prisma,
  ReportStatus,
  SenderType
} from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const customerReportInclude = {
  assignment: {
    include: {
      contractorCompany: true,
      bid: true
    }
  },
  messages: {
    orderBy: { createdAt: "asc" as const }
  },
  statusHistory: {
    orderBy: { createdAt: "asc" as const }
  },
  workUpdates: {
    orderBy: { createdAt: "asc" as const },
    include: {
      contractorCompany: true
    }
  },
  _count: {
    select: {
      attachments: true,
      messages: true,
      bids: true
    }
  }
} satisfies Prisma.ReportInclude;

type CustomerReportRecord = Prisma.ReportGetPayload<{ include: typeof customerReportInclude }>;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findReportsByPhone(phone: string) {
    const normalizedPhone = phone.trim();
    const reports = await this.prisma.report.findMany({
      where: {
        customerPhone: normalizedPhone
      },
      orderBy: { createdAt: "desc" },
      include: customerReportInclude
    });

    return reports.map((report) => this.serializeReport(report));
  }

  async findReportByVerification(reportNo: string, verificationCode: string) {
    const report = await this.prisma.report.findFirst({
      where: {
        reportNo: reportNo.trim(),
        verificationCode: verificationCode.trim()
      },
      include: customerReportInclude
    });

    return report ? this.serializeReport(report) : null;
  }

  /**
   * 고객 답변 등록. 신고 접수 시 입력한 연락처와 일치해야 한다.
   * 추가질문 대기 상태였다면 관리자 검수로 되돌린다.
   */
  async addCustomerReply(reportNo: string, phone: string, content: string) {
    const cleanContent = content.trim();

    if (!cleanContent) {
      throw new BadRequestException("답변 내용을 입력해 주세요.");
    }

    const report = await this.prisma.report.findUnique({
      where: { reportNo: reportNo.trim() }
    });

    if (!report) {
      throw new NotFoundException("신고를 찾을 수 없습니다.");
    }

    if (this.normalizePhone(report.customerPhone) !== this.normalizePhone(phone)) {
      throw new BadRequestException("신고 접수 시 입력한 연락처와 일치하지 않습니다.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.reportMessage.create({
        data: {
          reportId: report.id,
          senderType: SenderType.CUSTOMER,
          messageType: MessageType.TEXT,
          content: cleanContent.slice(0, 2000)
        }
      });

      if (report.status === ReportStatus.CUSTOMER_INFO_REQUIRED) {
        await tx.report.update({
          where: { id: report.id },
          data: { status: ReportStatus.ADMIN_REVIEW }
        });

        await tx.reportStatusHistory.create({
          data: {
            reportId: report.id,
            fromStatus: report.status,
            toStatus: ReportStatus.ADMIN_REVIEW,
            actorType: ActorType.CUSTOMER,
            reason: "고객 답변 등록"
          }
        });
      }
    });

    const updated = await this.prisma.report.findUniqueOrThrow({
      where: { id: report.id },
      include: customerReportInclude
    });

    return this.serializeReport(updated);
  }

  private normalizePhone(value: string) {
    return value.replace(/\D/g, "");
  }

  private serializeReport(report: CustomerReportRecord) {
    return {
      id: report.id,
      reportNo: report.reportNo,
      channel: report.channel,
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
      createdAt: toIso(report.createdAt),
      adminApprovedAt: toIso(report.adminApprovedAt),
      assignedAt: toIso(report.assignedAt),
      resolvedAt: toIso(report.resolvedAt),
      updatedAt: toIso(report.updatedAt),
      attachmentCount: report._count.attachments,
      messageCount: report._count.messages,
      bidCount: report._count.bids,
      assignment: report.assignment
        ? {
            id: report.assignment.id,
            contractorCompanyName: report.assignment.contractorCompany.companyName,
            estimatedPrice: report.assignment.bid.estimatedPrice,
            availableTime: toIso(report.assignment.bid.availableTime),
            selectionReason: report.assignment.selectionReason,
            customerMessageRendered: report.assignment.customerMessageRendered,
            assignedAt: toIso(report.assignment.assignedAt)
          }
        : null,
      messages: report.messages.map((message) => ({
        id: message.id,
        senderType: message.senderType,
        messageType: message.messageType,
        content: message.content,
        createdAt: toIso(message.createdAt)
      })),
      statusHistory: report.statusHistory.map((history) => ({
        id: history.id,
        fromStatus: history.fromStatus,
        toStatus: history.toStatus,
        actorType: history.actorType,
        reason: history.reason,
        createdAt: toIso(history.createdAt)
      })),
      workUpdates: report.workUpdates.map((update) => ({
        id: update.id,
        contractorCompanyName: update.contractorCompany.companyName,
        status: update.status,
        note: update.note,
        finalPrice: update.finalPrice,
        photoUrls: update.photoUrls,
        createdAt: toIso(update.createdAt)
      }))
    };
  }
}
