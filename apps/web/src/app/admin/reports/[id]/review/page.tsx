import { notFound } from "next/navigation";
import {
  AdminReportHeader,
  AdminReportReview,
} from "@/components/admin-report-detail";
import { AdminShell } from "@/components/admin-shell";
import { getReport } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export default async function AdminReportReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    notFound();
  }

  return (
    <AdminShell>
      <AdminReportHeader active="review" report={report} />
      <AdminReportReview report={report} />
    </AdminShell>
  );
}
