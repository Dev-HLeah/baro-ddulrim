import { notFound } from "next/navigation";
import {
  AdminReportHeader,
  AdminReportHistory,
} from "@/components/admin-report-detail";
import { AdminShell } from "@/components/admin-shell";
import { getReport } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export default async function AdminReportHistoryPage({
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
      <AdminReportHeader active="history" report={report} />
      <AdminReportHistory report={report} />
    </AdminShell>
  );
}
