import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { extractBearerToken, type AuthenticatedRequest } from "./auth.types";
import { SupabaseAuthService } from "./supabase-auth.service";

/**
 * Supabase 토큰을 검증하고, 업체 계정(ContractorAccount)을 보장한다.
 * 가입 직후 첫 인증 요청에서 계정이 없으면 자동으로 생성한다.
 */
@Injectable()
export class ContractorGuard implements CanActivate {
  constructor(
    private readonly auth: SupabaseAuthService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException("로그인이 필요합니다.");
    }

    const authUser = await this.auth.verifyToken(token);

    if (!authUser.email) {
      throw new UnauthorizedException("이메일 정보가 없는 계정입니다.");
    }

    const name = this.metadataString(authUser.metadata.name) ?? "담당자";
    const phone = this.metadataString(authUser.metadata.phone) ?? "";

    const account = await this.prisma.contractorAccount.upsert({
      where: { email: authUser.email },
      update: { authUserId: authUser.id },
      create: {
        authUserId: authUser.id,
        email: authUser.email,
        name,
        phone,
      },
      include: { company: { select: { id: true } } },
    });

    request.authUser = authUser;
    request.account = {
      id: account.id,
      email: account.email,
      name: account.name,
      phone: account.phone,
      companyId: account.company?.id ?? null,
    };
    return true;
  }

  private metadataString(value: unknown): string | null {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
