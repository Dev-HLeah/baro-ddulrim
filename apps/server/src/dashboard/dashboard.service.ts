import { Injectable } from "@nestjs/common";
import { ReportStatus } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [reports, activeContractors] = await Promise.all([
      this.prisma.report.findMany({
        include: {
          assignment: true,
          workUpdates: true
        }
      }),
      this.prisma.contractorCompany.count({
        where: {
          status: "ACTIVE"
        }
      })
    ]);

    const statusCounts = reports.reduce<Record<string, number>>((acc, report) => {
      acc[report.status] = (acc[report.status] ?? 0) + 1;
      return acc;
    }, {});

    const channelCounts = reports.reduce<Record<string, number>>((acc, report) => {
      acc[report.channel] = (acc[report.channel] ?? 0) + 1;
      return acc;
    }, {});

    const urgentCount = reports.filter((report) => report.urgency !== "NORMAL").length;
    const mapMarkerCount = reports.filter(
      (report) => report.latitude !== null && report.longitude !== null
    ).length;
    const adminReviewCount =
      (statusCounts[ReportStatus.ADMIN_REVIEW] ?? 0) +
      (statusCounts[ReportStatus.CUSTOMER_INFO_REQUIRED] ?? 0);
    const biddingCount =
      (statusCounts[ReportStatus.APPROVED_FOR_BIDDING] ?? 0) +
      (statusCounts[ReportStatus.BIDDING] ?? 0);
    const assignedCount = reports.filter((report) => report.assignedAt).length;
    const resolvedCount = reports.filter((report) => report.resolvedAt).length;

    return {
      totalReports: reports.length,
      adminReviewCount,
      biddingCount,
      assignedCount,
      resolvedCount,
      urgentCount,
      activeContractors,
      mapMarkerCount,
      statusCounts,
      channelCounts,
      averageMinutes: {
        approval: this.averageMinutes(
          reports
            .filter((report) => report.adminApprovedAt)
            .map((report) => [report.createdAt, report.adminApprovedAt] as const)
        ),
        assignment: this.averageMinutes(
          reports
            .filter((report) => report.assignedAt)
            .map((report) => [report.createdAt, report.assignedAt] as const)
        ),
        resolution: this.averageMinutes(
          reports
            .filter((report) => report.assignedAt && report.resolvedAt)
            .map((report) => [report.assignedAt, report.resolvedAt] as const)
        )
      }
    };
  }

  private averageMinutes(pairs: ReadonlyArray<readonly [Date | null, Date | null]>) {
    const durations = pairs
      .filter((pair): pair is readonly [Date, Date] => Boolean(pair[0] && pair[1]))
      .map(([from, to]) => Math.max(0, to.getTime() - from.getTime()) / 60000);

    if (durations.length === 0) {
      return null;
    }

    return Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length);
  }
}
