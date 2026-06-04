import { Injectable } from "@nestjs/common";
import { toIso, toNumber } from "../common/format";
import { PrismaService } from "../prisma/prisma.service";

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

  private getMinBidPrice(bids: Array<{ estimatedPrice: number | null }>) {
    const prices = bids
      .map((bid) => bid.estimatedPrice)
      .filter((price): price is number => typeof price === "number");

    return prices.length > 0 ? Math.min(...prices) : null;
  }
}
