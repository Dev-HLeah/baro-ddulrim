"use client";

import { useState } from "react";

export function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 미지원 환경에서는 조용히 무시한다.
    }
  }

  return (
    <button className="copy-button" onClick={onCopy} type="button">
      {copied ? "복사됨" : label}
    </button>
  );
}
