import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export type SupabaseAuthUser = {
  id: string;
  email: string | null;
  metadata: Record<string, unknown>;
};

/**
 * Supabase Auth가 발급한 액세스 토큰(JWT)을 검증한다.
 * 최신 프로젝트는 비대칭 서명키(ES256/RS256)를 쓰므로 JWKS로 먼저 검증하고,
 * 레거시 HS256 JWT secret(SUPABASE_JWT_SECRET)은 폴백으로 유지한다.
 */
@Injectable()
export class SupabaseAuthService {
  private readonly secret: Uint8Array | null;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | null;

  constructor(private readonly config: ConfigService) {
    const jwtSecret = this.config.get<string>("SUPABASE_JWT_SECRET");
    this.secret = jwtSecret ? new TextEncoder().encode(jwtSecret) : null;

    const supabaseUrl = this.config.get<string>("SUPABASE_URL")?.replace(/\/$/, "");
    this.jwks = supabaseUrl
      ? createRemoteJWKSet(
          new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
        )
      : null;
  }

  async verifyToken(token: string): Promise<SupabaseAuthUser> {
    const payload = await this.verifyPayload(token);
    const id = typeof payload.sub === "string" ? payload.sub : null;

    if (!id) {
      throw new UnauthorizedException("유효하지 않은 토큰입니다.");
    }

    const email =
      typeof payload.email === "string" ? payload.email.toLowerCase() : null;
    const metadata =
      (payload.user_metadata as Record<string, unknown> | undefined) ?? {};

    return { id, email, metadata };
  }

  private async verifyPayload(token: string): Promise<JWTPayload> {
    if (!this.jwks && !this.secret) {
      throw new UnauthorizedException("인증 설정이 누락되었습니다.");
    }

    // 1) 비대칭 서명키(JWKS) 검증 — 최신 Supabase 프로젝트 기본값
    if (this.jwks) {
      try {
        const { payload } = await jwtVerify(token, this.jwks);
        return payload;
      } catch {
        // HS256 레거시 토큰이면 아래 폴백에서 처리한다.
      }
    }

    // 2) 레거시 HS256 secret 폴백
    if (this.secret) {
      try {
        const { payload } = await jwtVerify(token, this.secret);
        return payload;
      } catch {
        throw new UnauthorizedException("인증에 실패했습니다.");
      }
    }

    throw new UnauthorizedException("인증에 실패했습니다.");
  }
}
