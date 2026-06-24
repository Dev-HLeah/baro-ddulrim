"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`
      }
    );

    if (resetError) {
      setError("메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setLoading(false);
      return;
    }

    setSentTo(email.trim());
    setLoading(false);
  }

  if (sentTo) {
    return (
      <div className="auth-body">
        <h1 className="auth-title">재설정 메일을 보냈습니다</h1>
        <p className="auth-subtitle">
          <strong>{sentTo}</strong> 로 비밀번호 재설정 링크를 보냈습니다. 메일의
          링크를 눌러 새 비밀번호를 설정해 주세요.
        </p>
        <p className="auth-switch">
          <Link href="/login">로그인으로 돌아가기</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-body">
      <h1 className="auth-title">비밀번호 찾기</h1>
      <p className="auth-subtitle">
        가입한 이메일을 입력하면 재설정 링크를 보내드립니다.
      </p>

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
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" disabled={loading} type="submit">
          {loading ? "발송 중..." : "재설정 메일 보내기"}
        </button>
      </form>

      <p className="auth-switch">
        <Link href="/login">로그인으로 돌아가기</Link>
      </p>
    </div>
  );
}
