import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthAccount, AuthAdmin, AuthenticatedRequest } from "./auth.types";

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthAdmin | undefined => {
    return context.switchToHttp().getRequest<AuthenticatedRequest>().admin;
  },
);

export const CurrentAccount = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthAccount | undefined => {
    return context.switchToHttp().getRequest<AuthenticatedRequest>().account;
  },
);
