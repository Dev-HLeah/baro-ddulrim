import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 소셜 로그인 / 이메일 인증 / 비밀번호 재설정 링크의 공통 콜백.
 * 전달된 code를 세션으로 교환한 뒤 next 경로로 이동한다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNext(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

// 오픈 리다이렉트 방지: 같은 사이트의 경로만 허용한다.
function sanitizeNext(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/register";
}
