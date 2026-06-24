import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { jwtVerify } from "jose";

export type SupabaseAuthUser = {
  id: string;
  email: string | null;
  metadata: Record<string, unknown>;
};

/**
 * Supabase Auth가 발급한 액세스 토큰(JWT)을 검증한다.
 * 레거시 HS256 JWT secret(SUPABASE_JWT_SECRET) 기반으로 서명을 확인한다.
 */
@Injectable()
export class SupabaseAuthService {
  private readonly secret: Uint8Array | null;

  constructor(private readonly config: ConfigService) {
    const jwtSecret = this.config.get<string>("SUPABASE_JWT_SECRET");
    this.secret = jwtSecret ? new TextEncoder().encode(jwtSecret) : null;
  }

  async verifyToken(token: string): Promise<SupabaseAuthUser> {
    if (!this.secret) {
      throw new UnauthorizedException("인증 설정이 누락되었습니다.");
    }

    try {
      const { payload } = await jwtVerify(token, this.secret);
      const id = typeof payload.sub === "string" ? payload.sub : null;

      if (!id) {
        throw new UnauthorizedException("유효하지 않은 토큰입니다.");
      }

      const email =
        typeof payload.email === "string" ? payload.email.toLowerCase() : null;
      const metadata =
        (payload.user_metadata as Record<string, unknown> | undefined) ?? {};

      return { id, email, metadata };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("인증에 실패했습니다.");
    }
  }
}
