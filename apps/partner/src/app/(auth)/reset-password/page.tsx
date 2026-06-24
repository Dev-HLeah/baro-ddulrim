"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(
        "재설정에 실패했습니다. 링크가 만료되었을 수 있으니 다시 시도해 주세요."
      );
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="auth-body">
        <h1 className="auth-title">비밀번호가 변경되었습니다</h1>
        <p className="auth-subtitle">새 비밀번호로 로그인해 주세요.</p>
        <button
          className="primary-button"
          onClick={() => {
            router.replace("/");
            router.refresh();
          }}
          type="button"
        >
          작업대로 이동
        </button>
      </div>
    );
  }

  return (
    <div className="auth-body">
      <h1 className="auth-title">새 비밀번호 설정</h1>
      <p className="auth-subtitle">사용할 새 비밀번호를 입력해 주세요.</p>

      <form className="admin-form" onSubmit={onSubmit}>
        <label className="form-field">
          <span>새 비밀번호 (8자 이상)</span>
          <input
            autoComplete="new-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="새 비밀번호"
            required
            type="password"
            value={password}
          />
        </label>
        <label className="form-field">
          <span>새 비밀번호 확인</span>
          <input
            autoComplete="new-password"
            name="confirm"
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="새 비밀번호 확인"
            required
            type="password"
            value={confirm}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" disabled={loading} type="submit">
          {loading ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>

      <p className="auth-switch">
        <Link href="/login">로그인으로 돌아가기</Link>
      </p>
    </div>
  );
}
