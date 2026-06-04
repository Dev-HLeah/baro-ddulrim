import { FileCheck2, Hammer, TimerReset } from "lucide-react";

const jobs = [
  { title: "역삼동 하수구 역류", status: "입찰 가능", icon: TimerReset },
  { title: "분당 상가 배수 막힘", status: "배정됨", icon: Hammer },
  { title: "수원 악취 민원", status: "완료 확인", icon: FileCheck2 }
];

export default function ContractorPage() {
  return (
    <main className="workspace-page">
      <header className="workspace-header">
        <p className="eyebrow">업체</p>
        <h1>작업 목록</h1>
      </header>
      <section className="report-list">
        {jobs.map((job) => {
          const Icon = job.icon;
          return (
            <article className="report-item" key={job.title}>
              <div className="item-title">
                <Icon aria-hidden="true" size={18} />
                <p>{job.title}</p>
              </div>
              <span className="status-badge">{job.status}</span>
            </article>
          );
        })}
      </section>
    </main>
  );
}
