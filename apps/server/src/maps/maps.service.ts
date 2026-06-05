import { Injectable } from "@nestjs/common";
import { toIso, toNumber } from "../common/format";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MapsService {
  constructor(private readonly prisma: PrismaService) {}

  async findReportMarkers() {
    const reports = await this.prisma.report.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null }
      },
      orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
      include: {
        assignment: {
          include: {
            contractorCompany: true
          }
        },
        workUpdates: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            contractorCompany: true
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
      addressText: report.addressText,
      roadAddressText: report.roadAddressText,
      placeName: report.placeName,
      latitude: toNumber(report.latitude),
      longitude: toNumber(report.longitude),
      assignedCompanyName: report.assignment?.contractorCompany.companyName ?? null,
      latestWorkStatus: report.workUpdates[0]?.status ?? null,
      latestWorkNote: report.workUpdates[0]?.note ?? null,
      createdAt: toIso(report.createdAt),
      assignedAt: toIso(report.assignedAt),
      resolvedAt: toIso(report.resolvedAt)
    }));
  }
}
