import { Module } from "@nestjs/common";
import { AdminGuard } from "./admin.guard";
import { AuthController } from "./auth.controller";
import { ContractorGuard } from "./contractor.guard";
import { SupabaseAuthService } from "./supabase-auth.service";

@Module({
  controllers: [AuthController],
  providers: [SupabaseAuthService, AdminGuard, ContractorGuard],
  exports: [SupabaseAuthService, AdminGuard, ContractorGuard],
})
export class AuthModule {}
