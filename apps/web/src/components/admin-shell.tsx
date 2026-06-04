import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/reports", label: "신고" },
  { href: "/admin/contractors", label: "업체" },
  { href: "/admin/map", label: "지도" },
  { href: "/admin/templates", label: "템플릿" },
  { href: "/admin/settings", label: "설정" }
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="admin-layout">
      <aside className="admin-sidebar" aria-label="관리자 메뉴">
        <div>
          <div className="brand-row">
            <div className="brand-mark">바</div>
            <div>
              <p className="eyebrow">바로 뚫림</p>
              <strong>관리자</strong>
            </div>
          </div>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="admin-content">{children}</section>
    </main>
  );
}
