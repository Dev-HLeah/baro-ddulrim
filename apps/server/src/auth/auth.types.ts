import type { Request } from "express";
import type { SupabaseAuthUser } from "./supabase-auth.service";

export type AuthAdmin = {
  id: string;
  email: string;
  name: string;
};

export type AuthAccount = {
  id: string;
  email: string;
  name: string;
  phone: string;
  companyId: string | null;
};

export type AuthenticatedRequest = Request & {
  authUser?: SupabaseAuthUser;
  admin?: AuthAdmin;
  account?: AuthAccount;
};

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.authorization;

  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}
