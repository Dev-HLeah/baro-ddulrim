"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileSearch, KeyRound } from "lucide-react";

/** 신고 상세의 확인번호 입력 — 전체 리로드 없이 클라이언트 전환으로 조회한다. */
export function VerificationForm({
  reportNo,
  initialCode,
}: {
  reportNo: string;
  initialCode?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState(initialCode ?? "");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!code.trim()) {
      return;
    }

    startTransition(() => {
      router.push(
        `/report/${encodeURIComponent(reportNo)}?verificationCode=${encodeURIComponent(code.trim())}`,
      );
    });
  }

  return (
    <form className="lookup-form verification-panel" onSubmit={onSubmit}>
      <label htmlFor="verificationCode">확인번호</label>
      <div className="input-row">
        <KeyRound aria-hidden="true" size={18} />
        <input
          autoFocus
          id="verificationCode"
          name="verificationCode"
          onChange={(event) => setCode(event.target.value)}
          placeholder="6자리 확인번호"
          value={code}
        />
      </div>
      <button className="secondary-button" disabled={isPending} type="submit">
        <FileSearch aria-hidden="true" size={16} />
        {isPending ? "확인 중..." : "상세 확인"}
      </button>
    </form>
  );
}
