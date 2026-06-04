import { ClipboardCheck, Clock3, MapPinned, UsersRound } from "lucide-react";

const metrics = [
  { label: "검수 대기", value: "7", icon: ClipboardCheck },
  { label: "입찰중", value: "11", icon: Clock3 },
  { label: "활동 업체", value: "24", icon: UsersRound },
  { label: "지도 마커", value: "36", icon: MapPinned }
];

export default function AdminPage() {
  return (
    <main className="workspace-page">
      <header className="workspace-header">
        <p className="eyebrow">관리자</p>
        <h1>운영 대시보드</h1>
      </header>
      <section className="dashboard-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className="metric" key={metric.label}>
              <Icon aria-hidden="true" size={20} />
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          );
        })}
      </section>
    </main>
  );
}
