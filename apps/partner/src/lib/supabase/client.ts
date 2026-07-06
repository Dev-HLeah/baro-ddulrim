import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * 클라이언트 컴포넌트(로그인/회원가입 폼)에서 쓰는 Supabase 클라이언트.
 * 쿠키는 포트를 구분하지 않으므로, 같은 localhost의 관리자 웹(3000)과
 * 세션이 섞이지 않도록 파트너 전용 쿠키 이름을 쓴다.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: { name: "sb-baro-partner-auth" }
  });
}
