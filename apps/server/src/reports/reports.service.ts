import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { toIso, toNumber } from "../common/format";
import {
  ActorType,
  BidStatus,
  IssueType,
  LocationConfirmedBy,
  MapProvider,
  MessageType,
  Prisma,
  ReportStatus,
  SenderType,
  TemplateChannel,
  Urgency
} from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ApproveReportDto, AssignReportDto, UpdateReportDto } from "./dto/report-actions.dto";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const reports = await this.prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        bids: {
          include: {
            contractorCompany: true
          }
        },
        assignment: {
          include: {
            contractorCompany: true
          }
        },
        _count: {
          select: {
            messages: true,
            attachments: true,
            bids: true,
            workUpdates: true
          }
        }
      }
    });

    return reports.map((report) => ({
      id: report.id,
      reportNo: report.reportNo,
      customerPhone: report.customerPhone,
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
      bidCount: report._count.bids,
      messageCount: report._count.messages,
      attachmentCount: report._count.attachments,
      workUpdateCount: report._count.workUpdates,
      assignedCompanyName: report.assignment?.contractorCompany.companyName ?? null,
      minEstimatedPrice: this.getMinBidPrice(report.bids),
      createdAt: toIso(report.createdAt),
      adminApprovedAt: toIso(report.adminApprovedAt),
      assignedAt: toIso(report.assignedAt),
      resolvedAt: toIso(report.resolvedAt),
      updatedAt: toIso(report.updatedAt)
    }));
  }

  async findOne(id: string) {
    const report = await this.prisma.report.findFirst({
      where: {
        OR: [{ id }, { reportNo: id }]
      },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: "asc" }
        },
        attachments: true,
        aiAnalyses: {
          orderBy: { createdAt: "desc" }
        },
        revisions: {
          orderBy: { createdAt: "desc" }
        },
        statusHistory: {
          orderBy: { createdAt: "asc" }
        },
        locationCandidates: {
          orderBy: { createdAt: "desc" }
        },
        bids: {
          orderBy: { submittedAt: "desc" },
          include: {
            contractorCompany: true
          }
        },
        assignment: {
          include: {
            contractorCompany: true,
            bid: true
          }
        },
        workUpdates: {
          orderBy: { createdAt: "asc" },
          include: {
            contractorCompany: true
          }
        }
      }
    });

    if (!report) {
      return null;
    }

    return {
      id: report.id,
      reportNo: report.reportNo,
      verificationCode: report.verificationCode,
      customerPhone: report.customerPhone,
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
      assignedCompanyName: report.assignment?.contractorCompany.companyName ?? null,
      createdAt: toIso(report.createdAt),
      adminApprovedAt: toIso(report.adminApprovedAt),
      assignedAt: toIso(report.assignedAt),
      resolvedAt: toIso(report.resolvedAt),
      updatedAt: toIso(report.updatedAt),
      messages: report.messages.map((message) => ({
        id: message.id,
        senderType: message.senderType,
        messageType: message.messageType,
        content: message.content,
        createdAt: toIso(message.createdAt)
      })),
      attachments: report.attachments.map((attachment) => ({
        id: attachment.id,
        fileType: attachment.fileType,
        fileUrl: attachment.fileUrl,
        originalName: attachment.originalName,
        createdAt: toIso(attachment.createdAt)
      })),
      aiAnalyses: report.aiAnalyses.map((analysis) => ({
        id: analysis.id,
        provider: analysis.provider,
        model: analysis.model,
        summary: analysis.summary,
        issueType: analysis.issueType,
        urgency: analysis.urgency,
        missingFields: analysis.missingFields,
        vendorDescription: analysis.vendorDescription,
        confidence: toNumber(analysis.confidence),
        needsReview: analysis.needsReview,
        createdAt: toIso(analysis.createdAt)
      })),
      revisions: report.revisions.map((revision) => ({
        id: revision.id,
        editorType: revision.editorType,
        fieldName: revision.fieldName,
        oldValue: revision.oldValue,
        newValue: revision.newValue,
        reason: revision.reason,
        createdAt: toIso(revision.createdAt)
      })),
      statusHistory: report.statusHistory.map((history) => ({
        id: history.id,
        fromStatus: history.fromStatus,
        toStatus: history.toStatus,
        actorType: history.actorType,
        reason: history.reason,
        createdAt: toIso(history.createdAt)
      })),
      locationCandidates: report.locationCandidates.map((candidate) => ({
        id: candidate.id,
        provider: candidate.provider,
        title: candidate.title,
        addressText: candidate.addressText,
        roadAddressText: candidate.roadAddressText,
        placeName: candidate.placeName,
        category: candidate.category,
        latitude: toNumber(candidate.latitude),
        longitude: toNumber(candidate.longitude),
        confidence: toNumber(candidate.confidence),
        createdAt: toIso(candidate.createdAt)
      })),
      bids: report.bids.map((bid) => ({
        id: bid.id,
        contractorCompanyId: bid.contractorCompanyId,
        contractorCompanyName: bid.contractorCompany.companyName,
        estimatedPrice: bid.estimatedPrice,
        availableTime: toIso(bid.availableTime),
        canWork: bid.canWork,
        workNote: bid.workNote,
        extraCostPolicy: bid.extraCostPolicy,
        status: bid.status,
        submittedAt: toIso(bid.submittedAt)
      })),
      assignment: report.assignment
        ? {
            id: report.assignment.id,
            contractorCompanyName: report.assignment.contractorCompany.companyName,
            selectionReason: report.assignment.selectionReason,
            customerMessageRendered: report.assignment.customerMessageRendered,
            assignedAt: toIso(report.assignment.assignedAt)
          }
        : null,
      workUpdates: report.workUpdates.map((update) => ({
        id: update.id,
        contractorCompanyName: update.contractorCompany.companyName,
        status: update.status,
        note: update.note,
        finalPrice: update.finalPrice,
        createdAt: toIso(update.createdAt)
      }))
    };
  }

  async update(id: string, dto: UpdateReportDto) {
    const report = await this.findReportRecord(id);
    const updateData: Prisma.ReportUpdateInput = {};
    const changes: Array<{ fieldName: string; oldValue: string; newValue: string }> = [];
    const reason = this.cleanString(dto.reason) ?? "관리자 신고 내용 수정";

    this.applyStringField(updateData, changes, dto, "summary", report.summary);
    this.applyStringField(updateData, changes, dto, "description", report.description);
    this.applyStringField(updateData, changes, dto, "addressText", report.addressText);
    this.applyStringField(updateData, changes, dto, "roadAddressText", report.roadAddressText);
    this.applyStringField(updateData, changes, dto, "placeName", report.placeName);
    this.applyEnumField(updateData, changes, dto, "issueType", report.issueType);
    this.applyEnumField(updateData, changes, dto, "urgency", report.urgency);
    this.applyNumberField(updateData, changes, dto, "latitude", toNumber(report.latitude));
    this.applyNumberField(updateData, changes, dto, "longitude", toNumber(report.longitude));

    const touchedLocation = ["addressText", "roadAddressText", "placeName", "latitude", "longitude"].some(
      (fieldName) => this.has(dto, fieldName)
    );

    if (touchedLocation) {
      updateData.locationConfirmedAt = new Date();
      updateData.locationConfirmedBy = LocationConfirmedBy.ADMIN;
      updateData.locationProvider = report.locationProvider ?? MapProvider.KAKAO;
    }

    if (changes.length === 0 && Object.keys(updateData).length === 0) {
      return this.findOne(report.reportNo);
    }

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.report.update({
          where: { id: report.id },
          data: updateData
        });
      }

      if (changes.length > 0) {
        await tx.reportRevision.createMany({
          data: changes.map((change) => ({
            reportId: report.id,
            editorType: ActorType.ADMIN,
            fieldName: change.fieldName,
            oldValue: change.oldValue,
            newValue: change.newValue,
            reason
          }))
        });
      }
    });

    return this.findOne(report.reportNo);
  }

  async approveForBidding(id: string, dto: ApproveReportDto) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const report = await tx.report.findFirst({
        where: {
          OR: [{ id }, { reportNo: id }]
        }
      });

      if (!report) {
        throw new NotFoundException("신고를 찾을 수 없습니다.");
      }

      const disallowedStatuses: ReportStatus[] = [
        ReportStatus.ASSIGNED,
        ReportStatus.RESOLVED,
        ReportStatus.CANCELED,
        ReportStatus.REJECTED
      ];

      if (disallowedStatuses.includes(report.status)) {
        throw new BadRequestException("이미 배정, 해결, 취소, 반려된 신고는 입찰 승인할 수 없습니다.");
      }

      const nextStatus = ReportStatus.BIDDING;
      const reason = this.cleanString(dto.reason) ?? "관리자 입찰 승인";
      const now = new Date();

      const nextReport = await tx.report.update({
        where: { id: report.id },
        data: {
          status: nextStatus,
          adminApprovedAt: report.adminApprovedAt ?? now
        }
      });

      if (report.status !== nextStatus) {
        await tx.reportStatusHistory.create({
          data: {
            reportId: report.id,
            fromStatus: report.status,
            toStatus: nextStatus,
            actorType: ActorType.ADMIN,
            reason
          }
        });
      }

      await tx.aiAnalysis.updateMany({
        where: { reportId: report.id },
        data: { needsReview: false }
      });

      return nextReport;
    });

    return this.findOne(updated.reportNo);
  }

  async assignContractor(id: string, dto: AssignReportDto) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const report = await tx.report.findFirst({
        where: {
          OR: [{ id }, { reportNo: id }]
        },
        include: {
          assignment: true
        }
      });

      if (!report) {
        throw new NotFoundException("신고를 찾을 수 없습니다.");
      }

      if (report.assignment) {
        throw new ConflictException("이미 업체가 배정된 신고입니다.");
      }

      const bid = await tx.bid.findUnique({
        where: { id: dto.bidId },
        include: {
          contractorCompany: true
        }
      });

      if (!bid || bid.reportId !== report.id) {
        throw new BadRequestException("해당 신고의 입찰을 찾을 수 없습니다.");
      }

      if (!bid.canWork || bid.status !== BidStatus.SUBMITTED) {
        throw new BadRequestException("선택할 수 없는 입찰입니다.");
      }

      const now = new Date();
      const template = await this.findAssignmentTemplate(tx, dto.templateId);
      const renderedMessage = this.renderTemplate(
        template?.versions[0]?.content ?? template?.content ?? this.defaultAssignmentTemplate(),
        {
          customer_phone: report.customerPhone,
          issue_summary: report.summary ?? "접수",
          company_name: bid.contractorCompany.companyName,
          estimated_price: bid.estimatedPrice ? this.formatNumber(bid.estimatedPrice) : "미정",
          available_time: bid.availableTime ? this.formatDateTimeKo(bid.availableTime) : "미정"
        }
      );

      await tx.bid.update({
        where: { id: bid.id },
        data: { status: BidStatus.SELECTED }
      });

      await tx.bid.updateMany({
        where: {
          reportId: report.id,
          id: { not: bid.id },
          status: BidStatus.SUBMITTED
        },
        data: { status: BidStatus.REJECTED }
      });

      const admin = await tx.adminUser.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" }
      });

      const assignment = await tx.assignment.create({
        data: {
          reportId: report.id,
          bidId: bid.id,
          contractorCompanyId: bid.contractorCompanyId,
          assignedByAdminId: admin?.id,
          selectionReason: this.cleanString(dto.selectionReason),
          customerMessageTemplateId: template?.id,
          customerMessageRendered: renderedMessage,
          assignedAt: now
        }
      });

      if (template) {
        await tx.messageTemplateUsage.create({
          data: {
            templateId: template.id,
            templateVersionId: template.versions[0]?.id,
            reportId: report.id,
            assignmentId: assignment.id,
            renderedContent: renderedMessage
          }
        });
      }

      await tx.reportMessage.create({
        data: {
          reportId: report.id,
          senderType: SenderType.SYSTEM,
          messageType: MessageType.SYSTEM,
          content: renderedMessage
        }
      });

      const nextReport = await tx.report.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.ASSIGNED,
          assignedAt: now
        }
      });

      await tx.reportStatusHistory.create({
        data: {
          reportId: report.id,
          fromStatus: report.status,
          toStatus: ReportStatus.ASSIGNED,
          actorType: ActorType.ADMIN,
          reason: this.cleanString(dto.selectionReason) ?? "관리자 업체 배정"
        }
      });

      return nextReport;
    });

    return this.findOne(updated.reportNo);
  }

  private getMinBidPrice(bids: Array<{ estimatedPrice: number | null }>) {
    const prices = bids
      .map((bid) => bid.estimatedPrice)
      .filter((price): price is number => typeof price === "number");

    return prices.length > 0 ? Math.min(...prices) : null;
  }

  private async findReportRecord(id: string) {
    const report = await this.prisma.report.findFirst({
      where: {
        OR: [{ id }, { reportNo: id }]
      }
    });

    if (!report) {
      throw new NotFoundException("신고를 찾을 수 없습니다.");
    }

    return report;
  }

  private has(source: object, fieldName: string) {
    return (source as Record<string, unknown>)[fieldName] !== undefined;
  }

  private cleanString(value: string | null | undefined) {
    if (value == null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private revisionValue(value: unknown) {
    if (value == null) {
      return "";
    }

    return String(value);
  }

  private pushChange(
    changes: Array<{ fieldName: string; oldValue: string; newValue: string }>,
    fieldName: string,
    oldValue: unknown,
    newValue: unknown
  ) {
    const serializedOldValue = this.revisionValue(oldValue);
    const serializedNewValue = this.revisionValue(newValue);

    if (serializedOldValue !== serializedNewValue) {
      changes.push({
        fieldName,
        oldValue: serializedOldValue,
        newValue: serializedNewValue
      });
    }
  }

  private applyStringField(
    updateData: Prisma.ReportUpdateInput,
    changes: Array<{ fieldName: string; oldValue: string; newValue: string }>,
    dto: UpdateReportDto,
    fieldName: "summary" | "description" | "addressText" | "roadAddressText" | "placeName",
    oldValue: string | null
  ) {
    if (!this.has(dto, fieldName)) {
      return;
    }

    const newValue = this.cleanString(dto[fieldName]);
    updateData[fieldName] = newValue;
    this.pushChange(changes, fieldName, oldValue, newValue);
  }

  private applyEnumField(
    updateData: Prisma.ReportUpdateInput,
    changes: Array<{ fieldName: string; oldValue: string; newValue: string }>,
    dto: UpdateReportDto,
    fieldName: "issueType" | "urgency",
    oldValue: string | null
  ) {
    if (!this.has(dto, fieldName)) {
      return;
    }

    const newValue = dto[fieldName] ?? null;

    if (fieldName === "issueType") {
      updateData.issueType = newValue as IssueType | null;
    } else if (newValue) {
      updateData.urgency = newValue as Urgency;
    }

    this.pushChange(changes, fieldName, oldValue, newValue);
  }

  private applyNumberField(
    updateData: Prisma.ReportUpdateInput,
    changes: Array<{ fieldName: string; oldValue: string; newValue: string }>,
    dto: UpdateReportDto,
    fieldName: "latitude" | "longitude",
    oldValue: number | null
  ) {
    if (!this.has(dto, fieldName)) {
      return;
    }

    const newValue = dto[fieldName] ?? null;
    updateData[fieldName] = newValue;
    this.pushChange(changes, fieldName, oldValue, newValue);
  }

  private async findAssignmentTemplate(
    tx: Prisma.TransactionClient,
    templateId: string | null | undefined
  ) {
    if (templateId) {
      return tx.messageTemplate.findFirst({
        where: {
          id: templateId,
          isActive: true
        },
        include: {
          versions: {
            orderBy: { versionNo: "desc" },
            take: 1
          }
        }
      });
    }

    const assignmentTemplate = await tx.messageTemplate.findFirst({
      where: {
        channel: TemplateChannel.WEB,
        isActive: true,
        name: "업체 배정 안내"
      },
      include: {
        versions: {
          orderBy: { versionNo: "desc" },
          take: 1
        }
      }
    });

    if (assignmentTemplate) {
      return assignmentTemplate;
    }

    return tx.messageTemplate.findFirst({
      where: {
        channel: TemplateChannel.WEB,
        isActive: true
      },
      orderBy: { createdAt: "asc" },
      include: {
        versions: {
          orderBy: { versionNo: "desc" },
          take: 1
        }
      }
    });
  }

  private defaultAssignmentTemplate() {
    return "{{customer_phone}} 고객님, {{issue_summary}} 신고에 {{company_name}} 업체가 배정되었습니다. 예상 견적은 {{estimated_price}}이며 출동 가능 시간은 {{available_time}}입니다.";
  }

  private renderTemplate(template: string, values: Record<string, string>) {
    const rendered = Object.entries(values).reduce(
      (content, [key, value]) => content.replaceAll(`{{${key}}}`, value),
      template
    );

    return rendered.replaceAll("미정원", "미정");
  }

  private formatNumber(value: number) {
    return new Intl.NumberFormat("ko-KR").format(value);
  }

  private formatDateTimeKo(value: Date) {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(value);
  }
}
