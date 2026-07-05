"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  pendingText?: string;
}

export function SubmitButton({ children, pendingText = "처리 중...", ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button {...props} disabled={pending || props.disabled} aria-disabled={pending}>
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
