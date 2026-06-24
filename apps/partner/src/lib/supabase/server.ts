import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * 서버 컴포넌트/서버 액션에서 쓰는 Supabase 클라이언트.
 * 인증 쿠키를 읽고, 토큰 갱신 시 쿠키에 다시 기록한다.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // 서버 컴포넌트에서 호출되면 set이 막힐 수 있다. 미들웨어가 갱신을 담당한다.
        }
      }
    }
  });
}

/** 현재 로그인 세션의 액세스 토큰을 반환한다. 없으면 null. */
export async function getAccessToken(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}
