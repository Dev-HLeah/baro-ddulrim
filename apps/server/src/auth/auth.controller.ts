import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminGuard } from "./admin.guard";
import { CurrentAdmin } from "./auth.decorators";
import type { AuthAdmin } from "./auth.types";

@Controller("auth")
export class AuthController {
  @Get("admin/me")
  @UseGuards(AdminGuard)
  adminMe(@CurrentAdmin() admin: AuthAdmin) {
    return admin;
  }
}
