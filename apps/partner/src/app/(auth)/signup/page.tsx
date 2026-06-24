"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthOAuthButtons } from "@/components/auth-oauth-buttons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ContractorSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
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

    const supabase = createSupabaseBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim(), phone: phone.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/register`
      }
    });

    if (signUpError) {
      setError(
        signUpError.message.toLowerCase().includes("registered")
          ? "이미 가입된 이메일입니다."
          : "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요."
      );
      setLoading(false);
      return;
    }

    // 이메일 확인이 꺼져 있으면 세션이 바로 생성되어 업체 등록으로 이동한다.
    if (data.session) {
      router.replace("/register");
      router.refresh();
      return;
    }

    // 이메일 확인이 켜져 있으면 인증 메일 안내를 보여준다.
    setSentTo(email.trim());
    setLoading(false);
  }

  if (sentTo) {
    return (
      <div className="auth-body">
        <h1 className="auth-title">인증 메일을 보냈습니다</h1>
        <p className="auth-subtitle">
          <strong>{sentTo}</strong> 로 보낸 메일의 링크를 눌러 인증을 완료해
          주세요. 인증 후 업체 등록을 진행할 수 있습니다.
        </p>
        <p className="auth-switch">
          메일이 오지 않았나요? <Link href="/signup">다시 시도</Link>
        </p>
        <p className="auth-switch">
          인증을 마치셨나요? <Link href="/login">로그인</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-body">
      <h1 className="auth-title">업체 회원가입</h1>
      <p className="auth-subtitle">간단히 가입하고 업체 등록을 시작하세요.</p>

      <AuthOAuthButtons next="/register" />

      <div className="auth-divider">
        <span>또는 이메일로 가입</span>
      </div>

      <form className="admin-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="form-field">
            <span>담당자 이름</span>
            <input
              name="name"
              onChange={(event) => setName(event.target.value)}
              placeholder="홍길동"
              required
              value={name}
            />
          </label>
          <label className="form-field">
            <span>연락처</span>
            <input
              name="phone"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="010-0000-0000"
              required
              type="tel"
              value={phone}
            />
          </label>
        </div>
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
          <span>비밀번호 (8자 이상)</span>
          <input
            autoComplete="new-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호"
            required
            type="password"
            value={password}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" disabled={loading} type="submit">
          {loading ? "처리 중..." : "이메일로 회원가입"}
        </button>
      </form>

      <p className="auth-switch">
        이미 계정이 있으신가요? <Link href="/login">로그인</Link>
      </p>
    </div>
  );
}
