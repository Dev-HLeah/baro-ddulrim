"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ContractorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (signInError) {
      setError("이메일 또는 비밀번호를 확인해 주세요.");
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="workspace-page contractor-page auth-page">
      <header className="workspace-header">
        <p className="eyebrow">업체</p>
        <h1>업체 로그인</h1>
      </header>

      <section className="panel-section">
        <form className="admin-form" onSubmit={onSubmit}>
          <label className="form-field">
            <span>이메일</span>
            <input
              autoComplete="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="partner@example.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label className="form-field">
            <span>비밀번호</span>
            <input
              autoComplete="current-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
              required
              type="password"
              value={password}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="action-row">
            <button className="primary-button" disabled={loading} type="submit">
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </div>
        </form>
        <p className="auth-switch">
          아직 계정이 없으신가요? <Link href="/signup">업체 회원가입</Link>
        </p>
      </section>
    </main>
  );
}
