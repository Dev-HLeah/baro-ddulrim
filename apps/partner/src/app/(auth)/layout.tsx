import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link className="auth-brand" href="/">
          <span className="auth-brand-mark">바</span>
          <span className="auth-brand-text">
            <strong>바로 뚫림</strong>
            <small>업체 파트너</small>
          </span>
        </Link>
        {children}
      </div>
    </main>
  );
}
