import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { extractBearerToken, type AuthenticatedRequest } from "./auth.types";
import { SupabaseAuthService } from "./supabase-auth.service";

/**
 * Supabase 토큰을 검증하고, 연결된 활성 관리자(AdminUser)만 통과시킨다.
 */
@Injectable()
export class AdminGuard implements CanActivate {
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
    const admin = await this.prisma.adminUser.findFirst({
      where: {
        isActive: true,
        OR: [
          { authUserId: authUser.id },
          ...(authUser.email ? [{ email: authUser.email }] : []),
        ],
      },
    });

    if (!admin) {
      throw new ForbiddenException("관리자 권한이 없습니다.");
    }

    request.authUser = authUser;
    request.admin = { id: admin.id, email: admin.email, name: admin.name };
    return true;
  }
}
