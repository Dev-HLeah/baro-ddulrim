import { notFound } from "next/navigation";
import {
  AdminReportBids,
  AdminReportHeader,
} from "@/components/admin-report-detail";
import { AdminShell } from "@/components/admin-shell";
import { getMessageTemplates, getReport } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export default async function AdminReportBidsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [report, templates] = await Promise.all([
    getReport(id),
    getMessageTemplates(),
  ]);

  if (!report) {
    notFound();
  }

  return (
    <AdminShell>
      <AdminReportHeader active="bids" report={report} />
      <AdminReportBids report={report} templates={templates} />
    </AdminShell>
  );
}
